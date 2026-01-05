# """
# GlamAI - Profile Management Endpoints
# User profile setup, skin analysis, allergies
# """

# from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy import select
# from app.db.database import get_db
# from app.models.user import User, UserProfile
# from app.schemas.user import (
#     ProfileSetup, ProfileUpdate, UserProfileResponse,
#     SkinAnalysisResult, AllergyProfile, DashboardResponse, UserStats
# )
# from app.api.deps.auth import get_current_user
# from app.services.azure.vision_service import vision_service
# from app.services.azure.storage_service import storage_service
# from app.models.vanity import VanityProduct
# from app.models.makeup import MakeupSession, ScheduledEvent
# from datetime import datetime
# from loguru import logger

# router = APIRouter()


# @router.post("/setup", response_model=UserProfileResponse)
# async def setup_profile(
#     profile_data: ProfileSetup,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Initial profile setup after registration
#     """
#     # Update user basic info
#     current_user.full_name = profile_data.full_name
#     current_user.age = profile_data.age
#     current_user.location = profile_data.location
    
#     await db.commit()
#     await db.refresh(current_user, ["profile"])
    
#     return current_user.profile


# @router.post("/analyze-face", response_model=SkinAnalysisResult)
# async def analyze_face(
#     image: UploadFile = File(...),
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Analyze face image for skin tone, undertone, and concerns
#     """
#     # Validate file
#     if not image.content_type.startswith("image/"):
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="File must be an image"
#         )
    
#     # Read image
#     image_bytes = await image.read()
    
#     # Analyze with Azure Vision
#     analysis_result = await vision_service.analyze_face_for_skin(image_bytes)
    
#     # Upload image to storage
#     image_url = await storage_service.upload_face_image(
#         image_bytes,
#         current_user.id,
#         image.content_type
#     )
    
#     # Update profile
#     result = await db.execute(
#         select(UserProfile).where(UserProfile.user_id == current_user.id)
#     )
#     profile = result.scalar_one()
    
#     profile.skin_tone = analysis_result["skin_tone"]
#     profile.undertone = analysis_result["undertone"]
#     profile.skin_type = analysis_result["skin_type"]
#     profile.face_image_url = image_url
#     profile.face_analysis_data = analysis_result.get("raw_data", {})
    
#     # Store detected concerns
#     if analysis_result.get("concerns"):
#         profile.skin_concerns = analysis_result["concerns"]
    
#     await db.commit()
    
#     logger.info(f"Face analyzed for user {current_user.id}: {analysis_result['skin_tone']}")
    
#     return SkinAnalysisResult(
#         skin_tone=analysis_result["skin_tone"],
#         undertone=analysis_result["undertone"],
#         skin_type=analysis_result["skin_type"],
#         confidence=analysis_result["confidence"],
#         raw_data=analysis_result.get("raw_data")
#     )


# @router.put("/allergies", response_model=UserProfileResponse)
# async def update_allergies(
#     allergy_data: AllergyProfile,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Update user's allergy and sensitivity profile
#     """
#     result = await db.execute(
#         select(UserProfile).where(UserProfile.user_id == current_user.id)
#     )
#     profile = result.scalar_one()
    
#     profile.allergies = allergy_data.allergies
#     profile.sensitivity_level = allergy_data.sensitivity_level
    
#     await db.commit()
#     await db.refresh(profile)
    
#     return profile


# @router.put("/update", response_model=UserProfileResponse)
# async def update_profile(
#     profile_update: ProfileUpdate,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Update user profile
#     """
#     # Update user basic info
#     if profile_update.full_name is not None:
#         current_user.full_name = profile_update.full_name
#     if profile_update.age is not None:
#         current_user.age = profile_update.age
#     if profile_update.location is not None:
#         current_user.location = profile_update.location
    
#     # Update profile
#     result = await db.execute(
#         select(UserProfile).where(UserProfile.user_id == current_user.id)
#     )
#     profile = result.scalar_one()
    
#     # Update skin analysis
#     if profile_update.skin_tone is not None:
#         profile.skin_tone = profile_update.skin_tone
#     if profile_update.undertone is not None:
#         profile.undertone = profile_update.undertone
#     if profile_update.skin_type is not None:
#         profile.skin_type = profile_update.skin_type
    
#     # Update allergies
#     if profile_update.allergies is not None:
#         profile.allergies = profile_update.allergies
#     if profile_update.sensitivity_level is not None:
#         profile.sensitivity_level = profile_update.sensitivity_level
    
#     # Update preferences
#     if profile_update.preferred_language is not None:
#         profile.preferred_language = profile_update.preferred_language
#     if profile_update.enable_voice_guidance is not None:
#         profile.enable_voice_guidance = profile_update.enable_voice_guidance
#     if profile_update.enable_notifications is not None:
#         profile.enable_notifications = profile_update.enable_notifications
#     if profile_update.dark_mode is not None:
#         profile.dark_mode = profile_update.dark_mode
    
#     await db.commit()
#     await db.refresh(profile)
    
#     return profile


# @router.get("/profile", response_model=UserProfileResponse)
# async def get_profile(
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Get user profile
#     """
#     await db.refresh(current_user, ["profile"])
#     return current_user.profile


# @router.get("/dashboard", response_model=DashboardResponse)
# async def get_dashboard(
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Get dashboard data with stats and upcoming events
#     """
#     # Load profile
#     await db.refresh(current_user, ["profile"])
    
#     # Get stats
#     vanity_count = await db.execute(
#         select(VanityProduct).where(
#             VanityProduct.user_id == current_user.id,
#             VanityProduct.is_active == True
#         )
#     )
#     vanity_products = len(vanity_count.scalars().all())
    
#     upcoming_events_query = await db.execute(
#         select(ScheduledEvent).where(
#             ScheduledEvent.user_id == current_user.id,
#             ScheduledEvent.is_active == True,
#             ScheduledEvent.event_date >= datetime.utcnow()
#         ).order_by(ScheduledEvent.event_date)
#     )
#     upcoming_events = upcoming_events_query.scalars().all()
    
#     recent_sessions_query = await db.execute(
#         select(MakeupSession).where(
#             MakeupSession.user_id == current_user.id
#         ).order_by(MakeupSession.created_at.desc()).limit(5)
#     )
#     recent_sessions = recent_sessions_query.scalars().all()
    
#     stats = UserStats(
#         total_sessions=current_user.profile.total_sessions,
#         products_in_vanity=vanity_products,
#         upcoming_events=len(upcoming_events),
#         total_looks_saved=current_user.profile.total_sessions,
#         favorite_products=0  # TODO: implement favorite count
#     )
    
#     return DashboardResponse(
#         user=current_user,
#         stats=stats,
#         upcoming_events=[
#             {
#                 "id": event.id,
#                 "name": event.event_name,
#                 "date": event.event_date,
#                 "occasion": event.occasion.value
#             }
#             for event in upcoming_events[:3]
#         ],
#         recent_sessions=[
#             {
#                 "id": session.id,
#                 "occasion": session.occasion.value,
#                 "date": session.created_at,
#                 "status": session.status.value
#             }
#             for session in recent_sessions
#         ],
#         quick_tips=[
#             "Remove makeup before bed to keep skin healthy",
#             "Blend foundation in natural light for best results",
#             "Always prep skin with moisturizer before makeup"
#         ]
#     )


"""
GlamAI - Fixed Profile Endpoints
Handles dict response from vision service correctly
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.user import User, UserProfile
from app.schemas.user import (
    ProfileSetup, ProfileUpdate, UserProfileResponse,
    SkinAnalysisResult, AllergyProfile, DashboardResponse, 
    UserStats, SkinConcernDetail, FacialFeatures
)
from app.api.deps.auth import get_current_user
from app.services.azure.vision_service import vision_service
from app.services.azure.storage_service import storage_service
from app.models.vanity import VanityProduct
from app.models.makeup import MakeupSession, ScheduledEvent
from datetime import datetime
from loguru import logger
from dataclasses import asdict
from typing import Optional

router = APIRouter()


@router.post("/setup", response_model=UserProfileResponse)
async def setup_profile(
    profile_data: ProfileSetup,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Initial profile setup after registration"""
    current_user.full_name = profile_data.full_name
    current_user.age = profile_data.age
    current_user.location = profile_data.location
    
    await db.commit()
    await db.refresh(current_user, ["profile"])
    
    logger.info(f"✅ Profile setup for user {current_user.id}")
    return current_user.profile


@router.post("/analyze-face", response_model=SkinAnalysisResult)
async def analyze_face(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    🎯 Fast comprehensive face analysis (2-4 seconds)
    Uses Azure Computer Vision + OpenCV
    """
    try:
        # Validate
        if not image.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image (JPEG, PNG)"
            )
        
        # Read image
        image_bytes = await image.read()
        
        # Size check (max 10MB)
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image must be less than 10MB"
            )
        
        logger.info(f"🔬 Analyzing face for user {current_user.id}")
        
        # 🚀 FAST ANALYSIS (2-4 seconds)
        analysis_result = await vision_service.analyze_face_comprehensive(image_bytes)
        analysis_dict = asdict(analysis_result)   # ✅ convert dataclass to dict

        
        # 📤 Upload to storage
        image_url = await storage_service.upload_face_image(
            image_bytes,
            current_user.id,
            image.content_type
        )
        
        # 💾 Update profile
        result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == current_user.id)
        )
        profile = result.scalar_one()
        
        # Basic analysis
        profile.skin_tone = analysis_dict.get("skin_tone")
        profile.skin_tone_hex = analysis_dict.get("skin_tone_hex")
        profile.fitzpatrick_scale = analysis_dict.get("fitzpatrick_scale")
        profile.undertone = analysis_dict.get("undertone")
        profile.skin_type = analysis_dict.get("skin_type")
        
        # Detailed
        profile.texture_score = analysis_dict.get("texture_score")
        profile.hydration_level = analysis_dict.get("hydration_level")
        profile.oil_level = analysis_dict.get("oil_level")
        profile.pore_size = analysis_dict.get("pore_size")
        
        # Face
        profile.face_shape = analysis_dict.get("face_shape")
        profile.facial_features = analysis_dict.get("facial_features", {})
        
        # Concerns
        profile.skin_concerns = analysis_dict.get("concerns", [])
        
        # Metadata
        profile.face_image_url = image_url
        # profile.face_analysis_data = analysis_dict.get("raw_data", {})
        profile.last_analysis_date = datetime.utcnow()
        profile.analysis_confidence = analysis_dict.get("confidence_scores", {}).get("overall", 0.85)
        profile.analysis_version = "v2.0_optimized"
        
        await db.commit()
        
        logger.info(
            f"✅ Analysis saved: {profile.skin_tone} ({profile.fitzpatrick_scale}), "
            f"{profile.undertone} undertone, {len(profile.skin_concerns)} concerns"
        )
        
        # Return as Pydantic model
        return SkinAnalysisResult(
            skin_tone=analysis_dict["skin_tone"],
            skin_tone_hex=analysis_dict["skin_tone_hex"],
            fitzpatrick_scale=analysis_dict["fitzpatrick_scale"],
            undertone=analysis_dict["undertone"],
            skin_type=analysis_dict["skin_type"],
            texture_score=analysis_dict["texture_score"],
            hydration_level=analysis_dict["hydration_level"],
            oil_level=analysis_dict["oil_level"],
            pore_size=analysis_dict["pore_size"],
            face_shape=analysis_dict["face_shape"],
            facial_features=FacialFeatures(**analysis_dict.get("facial_features", {})),
            concerns=[
                SkinConcernDetail(
                    type=c["type"],
                    severity=c["severity"],
                    locations=c["locations"],
                    confidence=c["confidence"],
                    detected_automatically=c.get("detected_automatically", True),
                    notes=c.get("notes")
                )
                for c in analysis_dict.get("concerns", [])
            ],
            confidence_scores=analysis_dict.get("confidence_scores", {}),
            recommendations=analysis_dict.get("recommendations", []),
            raw_data=analysis_dict.get("raw_data")
        )
        
    except ValueError as ve:
        logger.error(f"❌ Validation error: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"❌ Face analysis error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to analyze face image. Please try again with a clear, well-lit face photo."
        )


@router.put("/allergies", response_model=UserProfileResponse)
async def update_allergies(
    allergy_data: AllergyProfile,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update allergy profile"""
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one()
    
    profile.allergies = allergy_data.allergies
    profile.sensitivity_level = allergy_data.sensitivity_level
    profile.ingredient_preferences = allergy_data.ingredient_preferences
    profile.avoid_ingredients = allergy_data.avoid_ingredients
    
    await db.commit()
    await db.refresh(profile)
    
    logger.info(f"✅ Allergies updated for user {current_user.id}")
    return profile


@router.put("/update", response_model=UserProfileResponse)
async def update_profile(
    profile_update: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user profile"""
    # Update user
    if profile_update.full_name is not None:
        current_user.full_name = profile_update.full_name
    if profile_update.age is not None:
        current_user.age = profile_update.age
    if profile_update.location is not None:
        current_user.location = profile_update.location
    
    # Get profile
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalar_one()
    
    # Update fields
    update_fields = {
        "skin_tone", "skin_tone_hex", "fitzpatrick_scale", "undertone", "skin_type",
        "texture_score", "hydration_level", "oil_level", "pore_size",
        "face_shape", "facial_features", "allergies", "sensitivity_level",
        "ingredient_preferences", "avoid_ingredients",
        "preferred_language", "enable_voice_guidance", 
        "enable_notifications", "dark_mode"
    }
    
    for field in update_fields:
        value = getattr(profile_update, field, None)
        if value is not None:
            setattr(profile, field, value)
    
    # Handle skin concerns separately
    if profile_update.skin_concerns is not None:
        profile.skin_concerns = [
            {
                "type": c.type,
                "severity": c.severity,
                "locations": c.locations,
                "confidence": c.confidence,
                "detected_automatically": c.detected_automatically,
                "notes": c.notes
            }
            for c in profile_update.skin_concerns
        ]
    
    await db.commit()
    await db.refresh(profile)
    
    logger.info(f"✅ Profile updated for user {current_user.id}")
    return profile


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user profile"""
    await db.refresh(current_user, ["profile"])
    return current_user.profile


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard with insights"""
    await db.refresh(current_user, ["profile"])
    
    # Get stats
    vanity_count = await db.execute(
        select(VanityProduct).where(
            VanityProduct.user_id == current_user.id,
            VanityProduct.is_active == True
        )
    )
    vanity_products = len(vanity_count.scalars().all())
    
    # Upcoming events
    upcoming_events_query = await db.execute(
        select(ScheduledEvent).where(
            ScheduledEvent.user_id == current_user.id,
            ScheduledEvent.is_active == True,
            ScheduledEvent.event_date >= datetime.utcnow()
        ).order_by(ScheduledEvent.event_date).limit(5)
    )
    upcoming_events = upcoming_events_query.scalars().all()
    
    # Recent sessions
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
        favorite_products=0
    )
    
    # Personalized tips
    personalized_tips = _generate_personalized_tips(current_user.profile)
    
    # Product suggestions
    product_suggestions = _generate_product_suggestions(current_user.profile)
    
    return DashboardResponse(
        user=current_user,
        stats=stats,
        skin_profile_complete=current_user.profile.is_analysis_complete,
        last_skin_analysis=current_user.profile.last_analysis_date,
        upcoming_events=[
            {
                "id": event.id,
                "name": event.event_name,
                "date": event.event_date,
                "occasion": event.occasion.value
            }
            for event in upcoming_events
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
            "Remove makeup before bed",
            "Blend foundation in natural light",
            "Prep skin with moisturizer"
        ],
        personalized_recommendations=personalized_tips,
        suggested_products=product_suggestions
    )


def _generate_personalized_tips(profile: UserProfile) -> list[str]:
    """Generate tips based on skin analysis"""
    tips = []
    
    if profile.skin_type == "Oily":
        tips.append("🌟 Use oil-free primer and setting powder")
    elif profile.skin_type == "Dry":
        tips.append("💧 Apply hydrating serum before makeup")
    elif profile.skin_type == "Combination":
        tips.append("🎯 Mattify T-zone, hydrate cheeks")
    
    if profile.undertone == "Warm":
        tips.append("🎨 Choose golden-toned foundations")
    elif profile.undertone == "Cool":
        tips.append("🎨 Opt for pink-toned foundations")
    
    if profile.skin_concerns:
        types = [c.get("type") for c in profile.skin_concerns]
        if "dark_circles" in types:
            tips.append("👁️ Use peach corrector for dark circles")
        if "large_pores" in types:
            tips.append("✨ Apply pore-minimizing primer")
    
    return tips[:5]


def _generate_product_suggestions(profile: UserProfile) -> list[dict]:
    """Generate product suggestions"""
    suggestions = []
    
    if profile.skin_tone and profile.undertone:
        suggestions.append({
            "category": "Foundation",
            "recommendation": f"{profile.undertone} undertone in {profile.skin_tone} shade",
            "priority": "high"
        })
    
    if profile.skin_type:
        primer_type = {
            "Oily": "mattifying, oil-control",
            "Dry": "hydrating, illuminating",
            "Combination": "balancing"
        }.get(profile.skin_type, "all-purpose")
        
        suggestions.append({
            "category": "Primer",
            "recommendation": f"Use {primer_type} primer",
            "priority": "medium"
        })
    
    return suggestions