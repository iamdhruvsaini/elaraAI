"""
GlamAI - Profile Management Endpoints
User profile setup, skin analysis, allergies
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.user import User, UserProfile
from app.schemas.user import (
    ProfileSetup, ProfileUpdate, UserProfileResponse,
    SkinAnalysisResult, AllergyProfile, DashboardResponse, UserStats
)
from app.api.deps.auth import get_current_user
from app.services.azure.vision_service import vision_service
from app.services.azure.storage_service import storage_service
from app.models.vanity import VanityProduct
from app.models.makeup import MakeupSession, ScheduledEvent
from datetime import datetime
from loguru import logger

router = APIRouter()


@router.post("/setup", response_model=UserProfileResponse)
async def setup_profile(
    profile_data: ProfileSetup,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Initial profile setup after registration
    """
    # Update user basic info
    current_user.full_name = profile_data.full_name
    current_user.age = profile_data.age
    current_user.location = profile_data.location
    
    await db.commit()
    await db.refresh(current_user, ["profile"])
    
    return current_user.profile


@router.post("/analyze-face", response_model=SkinAnalysisResult)
async def analyze_face(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze face image for skin tone, undertone, and concerns
    """
    # Validate file
    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Read image
    image_bytes = await image.read()
    
    # Analyze with Azure Vision
    analysis_result = await vision_service.analyze_face_for_skin(image_bytes)
    
    # Upload image to storage
    image_url = await storage_service.upload_face_image(
        image_bytes,
        current_user.id,
        image.content_type
    )
    
    # Update profile
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one()
    
    profile.skin_tone = analysis_result["skin_tone"]
    profile.undertone = analysis_result["undertone"]
    profile.skin_type = analysis_result["skin_type"]
    profile.face_image_url = image_url
    profile.face_analysis_data = analysis_result.get("raw_data", {})
    
    # Store detected concerns
    if analysis_result.get("concerns"):
        profile.skin_concerns = analysis_result["concerns"]
    
    await db.commit()
    
    logger.info(f"Face analyzed for user {current_user.id}: {analysis_result['skin_tone']}")
    
    return SkinAnalysisResult(
        skin_tone=analysis_result["skin_tone"],
        undertone=analysis_result["undertone"],
        skin_type=analysis_result["skin_type"],
        confidence=analysis_result["confidence"],
        raw_data=analysis_result.get("raw_data")
    )


@router.put("/allergies", response_model=UserProfileResponse)
async def update_allergies(
    allergy_data: AllergyProfile,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update user's allergy and sensitivity profile
    """
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one()
    
    profile.allergies = allergy_data.allergies
    profile.sensitivity_level = allergy_data.sensitivity_level
    
    await db.commit()
    await db.refresh(profile)
    
    return profile


@router.put("/update", response_model=UserProfileResponse)
async def update_profile(
    profile_update: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update user profile
    """
    # Update user basic info
    if profile_update.full_name is not None:
        current_user.full_name = profile_update.full_name
    if profile_update.age is not None:
        current_user.age = profile_update.age
    if profile_update.location is not None:
        current_user.location = profile_update.location
    
    # Update profile
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one()
    
    # Update skin analysis
    if profile_update.skin_tone is not None:
        profile.skin_tone = profile_update.skin_tone
    if profile_update.undertone is not None:
        profile.undertone = profile_update.undertone
    if profile_update.skin_type is not None:
        profile.skin_type = profile_update.skin_type
    
    # Update allergies
    if profile_update.allergies is not None:
        profile.allergies = profile_update.allergies
    if profile_update.sensitivity_level is not None:
        profile.sensitivity_level = profile_update.sensitivity_level
    
    # Update preferences
    if profile_update.preferred_language is not None:
        profile.preferred_language = profile_update.preferred_language
    if profile_update.enable_voice_guidance is not None:
        profile.enable_voice_guidance = profile_update.enable_voice_guidance
    if profile_update.enable_notifications is not None:
        profile.enable_notifications = profile_update.enable_notifications
    if profile_update.dark_mode is not None:
        profile.dark_mode = profile_update.dark_mode
    
    await db.commit()
    await db.refresh(profile)
    
    return profile


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user profile
    """
    await db.refresh(current_user, ["profile"])
    return current_user.profile


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get dashboard data with stats and upcoming events
    """
    # Load profile
    await db.refresh(current_user, ["profile"])
    
    # Get stats
    vanity_count = await db.execute(
        select(VanityProduct).where(
            VanityProduct.user_id == current_user.id,
            VanityProduct.is_active == True
        )
    )
    vanity_products = len(vanity_count.scalars().all())
    
    upcoming_events_query = await db.execute(
        select(ScheduledEvent).where(
            ScheduledEvent.user_id == current_user.id,
            ScheduledEvent.is_active == True,
            ScheduledEvent.event_date >= datetime.utcnow()
        ).order_by(ScheduledEvent.event_date)
    )
    upcoming_events = upcoming_events_query.scalars().all()
    
    recent_sessions_query = await db.execute(
        select(MakeupSession).where(
            MakeupSession.user_id == current_user.id
        ).order_by(MakeupSession.created_at.desc()).limit(5)
    )
    recent_sessions = recent_sessions_query.scalars().all()
    
    stats = UserStats(
        total_sessions=current_user.profile.total_sessions,
        products_in_vanity=vanity_products,
        upcoming_events=len(upcoming_events),
        total_looks_saved=current_user.profile.total_sessions,
        favorite_products=0  # TODO: implement favorite count
    )
    
    return DashboardResponse(
        user=current_user,
        stats=stats,
        upcoming_events=[
            {
                "id": event.id,
                "name": event.event_name,
                "date": event.event_date,
                "occasion": event.occasion.value
            }
            for event in upcoming_events[:3]
        ],
        recent_sessions=[
            {
                "id": session.id,
                "occasion": session.occasion.value,
                "date": session.created_at,
                "status": session.status.value
            }
            for session in recent_sessions
        ],
        quick_tips=[
            "Remove makeup before bed to keep skin healthy",
            "Blend foundation in natural light for best results",
            "Always prep skin with moisturizer before makeup"
        ]
    )