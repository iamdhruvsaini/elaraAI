"""
GlamAI - Makeup Session Endpoints
Complete makeup session workflow
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.user import User
from app.models.makeup import MakeupSession, SessionStatus
from app.schemas.makeup import (
    SessionStart, MakeupSessionResponse,
     HairStyleSuggestion, AIRecommendation,
    MakeupPlan, ProductMatch, StepCompletion, MistakeReport,
    MistakeFix, FinalLookSubmit, FinalLookAnalysis,StyleSessionCreate, StyleSessionResponse
)
from app.models.user import User, UserStyleSession
from app.api.deps.auth import get_current_user
from app.services.azure.vision_service import vision_service
from app.services.azure.storage_service import storage_service
from app.services.azure.llm_service import llm_service
# from app.services.azure.search_service import search_service
from app.models.vanity import VanityProduct
from datetime import datetime
from loguru import logger
from typing import Dict, List

router = APIRouter()

# 🧩 Accessory options for UI dropdowns
ACCESSORY_PARTS: Dict[str, List[str]] = {
    "ear": ["earring", "jhumka", "studs"],
    "neck": ["necklace", "choker", "chain"],
    "nose": ["nose ring", "nath"],
    "hand": ["bangle", "bracelet", "ring"],
    "hair": ["clip", "band", "tiara"],
}

MATERIALS: List[str] = ["gold", "silver", "artificial", "diamond", "pearl", "metal"]
# 🎨 Dynamic color configuration
COLOR_PALETTE = [
    {"name": "Gold", "hex": "#FFD700", "tags": ["metallic", "warm"]},
    {"name": "Silver", "hex": "#C0C0C0", "tags": ["metallic", "cool"]},
    {"name": "Rose Pink", "hex": "#FF66B2", "tags": ["bright", "feminine"]},
    {"name": "Emerald Green", "hex": "#50C878", "tags": ["bold", "festive"]},
    {"name": "Royal Blue", "hex": "#4169E1", "tags": ["cool", "royal"]},
    {"name": "Peach", "hex": "#FFE5B4", "tags": ["soft", "warm"]},
    {"name": "Maroon", "hex": "#800000", "tags": ["deep", "bold"]},
    {"name": "Lavender", "hex": "#E6E6FA", "tags": ["pastel", "cool"]},
    {"name": "Black", "hex": "#000000", "tags": ["neutral", "classic"]},
    {"name": "White", "hex": "#FFFFFF", "tags": ["neutral", "light"]}
]


@router.get("/accessory-options")
async def get_accessory_options():
    """
    💍 Get flexible accessory + color options for UI.
    Supports:
      - Dynamic dropdowns
      - Custom color picker integration
      - Material suggestions per part
    """
    try:
        options = {
            "parts": {
                "ear": {"label": "Ear Accessories", "items": ["jhumka", "studs", "hoops"], "default_materials": ["gold", "silver"]},
                "neck": {"label": "Neck Accessories", "items": ["necklace", "choker", "chain"], "default_materials": ["gold", "silver", "diamond"]},
                "nose": {"label": "Nose Accessories", "items": ["nose ring", "nath"], "default_materials": ["gold", "artificial"]},
                "hand": {"label": "Hand Accessories", "items": ["bangle", "bracelet", "ring"], "default_materials": ["gold", "silver", "artificial"]},
                "hair": {"label": "Hair Accessories", "items": ["clip", "band", "tiara"], "default_materials": ["metal", "pearl", "artificial"]}
            },
            "materials": MATERIALS,
            "colors": COLOR_PALETTE,
            "allow_custom_color": True,
            "example": {
                "ear": {"item": "jhumka", "material": "gold", "color": {"name": "Rose Pink", "hex": "#FF66B2"}},
                "neck": {"item": "choker", "material": "silver", "color": {"name": "Lavender", "hex": "#E6E6FA"}},
            }
        }

        logger.info("✅ Accessory options fetched successfully")
        return {"status": "success", "options": options}

    except Exception as e:
        logger.error(f"❌ Failed to fetch accessory options: {str(e)}")
        return {"status": "error", "message": "Failed to load accessory options"}



@router.post("/start", response_model=MakeupSessionResponse)
async def start_session(
    session_data: SessionStart,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Start a new makeup session
    """
    # Create new session
    new_session = MakeupSession(
        user_id=current_user.id,
        occasion=session_data.occasion,
        scope=session_data.scope,
        status=SessionStatus.IN_PROGRESS,
        outfit_description=session_data.outfit_description
    )
    
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    
    logger.info(f"Started makeup session {new_session.id} for user {current_user.id}")
    
    return new_session


# @router.post("/analyze-outfit")
# async def analyze_outfit_text(
#     description: str,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     result = await vision_service.analyze_outfit_text(description)
#     current_user.profile.face_analysis_data = result
#     await db.commit()
#     return {"message": "Outfit details updated", "data": result}

# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy.future import select
# from loguru import logger

# from app.db.database import get_db
# from app.models.user import UserStyleSession, User
# from app.schemas.makeup import StyleSessionCreate, StyleSessionResponse
# from app.services.azure.vision_service import vision_service
# from app.services.azure.llm_service import llm_service
# from app.dependencies import get_current_user


# router = APIRouter()


# ------------------------------------------------------------
# 🧩 CREATE NEW STYLE SESSION
# ------------------------------------------------------------
@router.post("/style-session", response_model=StyleSessionResponse)
async def create_style_session(
    data: StyleSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ✨ Create a new style session.
    Supports both free-text outfit input and manual accessory selections.
    """

    if not data.description:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Description cannot be empty.")

    try:
        # 🧠 Parse description using LLM
        parsed = await llm_service.parse_outfit_description(data.description)

        # 🪞 Merge manual accessories (if provided)
        merged_accessories = parsed.get("accessories", {}) or {}
        if data.accessories:
            merged_accessories.update(data.accessories)

        # 🧾 Extract outfit info
        outfit_type = parsed.get("outfit_type", "unknown")
        colors = parsed.get("colors", [])
        refined_description = parsed.get("refined_description", data.description)

        # 💾 Save session
        session = UserStyleSession(
            user_id=current_user.id,
            outfit_description=refined_description,
            outfit_type=outfit_type,
            outfit_colors=colors,
            accessories=merged_accessories,
            confidence=parsed.get("confidence", 0.9),
        )

        db.add(session)
        await db.commit()
        await db.refresh(session)

        logger.info(f"👗 New style session created for user {current_user.id}")

        return StyleSessionResponse(
            id=session.id,
            outfit_description=session.outfit_description,
            outfit_type=session.outfit_type,
            outfit_colors=session.outfit_colors,
            accessories=session.accessories,
            confidence=session.confidence,
            created_at=session.created_at.isoformat(),
            message="Style session created successfully."
        )

    except Exception as e:
        logger.error(f"❌ Error creating style session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create style session.")


# ------------------------------------------------------------
# 🪄 UPDATE EXISTING STYLE SESSION
# ------------------------------------------------------------
@router.put("/style-session/{session_id}/update", response_model=StyleSessionResponse)
async def update_style_session(
    session_id: int,
    data: StyleSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ✨ Update an existing style session (new outfit or accessory change)
    """
    result = await db.execute(
        select(UserStyleSession).where(
            UserStyleSession.id == session_id,
            UserStyleSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Style session not found")

    try:
        # 🧠 Re-analyze outfit text if provided
        outfit_result = {}
        if data.description:
            outfit_result = await vision_service.analyze_outfit_text(data.description)

        # 🪄 Merge accessories — manual overrides AI
        accessories_final = data.accessories or outfit_result.get("accessories", {})

        # 🗂 Update fields
        session.outfit_description = outfit_result.get("refined_description", data.description)
        session.outfit_type = outfit_result.get("outfit_type", session.outfit_type)
        session.outfit_colors = outfit_result.get("colors", session.outfit_colors)
        session.accessories = accessories_final
        session.confidence = outfit_result.get("confidence", session.confidence)

        await db.commit()
        await db.refresh(session)

        logger.info(f"🪄 Style session {session_id} updated for user {current_user.id}")

        return StyleSessionResponse(
            id=session.id,
            outfit_description=session.outfit_description,
            outfit_type=session.outfit_type,
            outfit_colors=session.outfit_colors,
            accessories=session.accessories,
            confidence=session.confidence,
            created_at=str(session.created_at),
            message="Style session updated successfully."
        )

    except Exception as e:
        logger.error(f"❌ Error updating style session: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update style session.")


@router.get("/style-history", response_model=List[StyleSessionResponse])
async def get_style_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's outfit & accessory history
    """
    result = await db.execute(
        select(UserStyleSession)
        .where(UserStyleSession.user_id == current_user.id)
        .order_by(UserStyleSession.created_at.desc())
    )
    sessions = result.scalars().all()
    return [
        StyleSessionResponse.model_validate(session)
        for session in sessions
    ]

@router.get("/{session_id}/hair-suggestion", response_model=HairStyleSuggestion)
async def get_hair_suggestion(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get AI hair style suggestion
    """
    # Get session
    result = await db.execute(
        select(MakeupSession).where(
            MakeupSession.id == session_id,
            MakeupSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Get suggestion from LLM
    outfit_data = {
        "style": session.outfit_style,
        "dominant_color": session.outfit_colors[0] if session.outfit_colors else "unknown",
        "description": session.outfit_description
    }
    
    suggestion = await llm_service.generate_hair_style_suggestion(
        outfit_data,
        session.accessories_data,
        session.occasion.value
    )
    
    # Save to session
    session.hair_style_recommendation = suggestion["recommended_style"]
    await db.commit()
    
    return HairStyleSuggestion(**suggestion)


@router.post("/{session_id}/confirm-hair")
async def confirm_hair_style(
    session_id: int,
    chosen_style: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    User confirms chosen hair style
    """
    result = await db.execute(
        select(MakeupSession).where(
            MakeupSession.id == session_id,
            MakeupSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    session.hair_style_chosen = chosen_style
    await db.commit()
    
    return {"message": "Hair style confirmed", "style": chosen_style}


@router.get("/{session_id}/accessory-recommendation", response_model=AIRecommendation)
async def get_accessory_recommendation(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get AI recommendation for accessories
    """
    result = await db.execute(
        select(MakeupSession).where(
            MakeupSession.id == session_id,
            MakeupSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    outfit_data = {
        "description": session.outfit_description,
        "dominant_color": session.outfit_colors[0] if session.outfit_colors else "unknown",
        "style": session.outfit_style,
        "colors": session.outfit_colors
    }
    
    recommendation = await llm_service.generate_accessory_recommendation(
        outfit_data,
        session.accessories_data,
        session.occasion.value
    )
    
    # Save suggestions
    session.ai_suggestions = recommendation
    await db.commit()
    
    return AIRecommendation(**recommendation)


@router.post("/{session_id}/generate-plan", response_model=MakeupPlan)
async def generate_makeup_plan(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    💄 Generate a complete makeup plan with AI (LLM + user profile + outfit context)
    """
    # 🧾 Fetch session
    result = await db.execute(
        select(MakeupSession).where(
            MakeupSession.id == session_id,
            MakeupSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # 👩‍🦰 Fetch user profile
    await db.refresh(current_user, ["profile"])
    profile = current_user.profile

    user_profile_data = {
        "skin_tone": profile.skin_tone,
        "undertone": profile.undertone,
        "skin_type": profile.skin_type,
        "skin_concerns": profile.skin_concerns,
        "allergies": profile.allergies
    }

    # 👗 Fetch latest style session
    style_result = await db.execute(
        select(UserStyleSession)
        .where(UserStyleSession.user_id == current_user.id)
        .order_by(UserStyleSession.created_at.desc())
        .limit(1)
    )
    style_session = style_result.scalar_one_or_none()

    if not style_session:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Please create a style session first.")

    outfit_data = {
        "refined_description": style_session.outfit_description,
        "outfit_type": style_session.outfit_type,
        "colors": style_session.outfit_colors,
        "dominant_color": style_session.outfit_colors[0] if style_session.outfit_colors else "unknown"
    }

    accessories_data = style_session.accessories

    # 💡 Generate plan using LLM
    makeup_plan = await llm_service.generate_makeup_plan(
        user_profile_data,
        session.occasion.value,
        session.scope.value,
        outfit_data,
        accessories_data
    )

    # 🩵 Inject occasion and scope if LLM missed them
    if "occasion" not in makeup_plan:
        makeup_plan["occasion"] = session.occasion.value
    if "scope" not in makeup_plan:
        makeup_plan["scope"] = session.scope.value

    # 💾 Save to database
    session.makeup_plan = makeup_plan
    session.total_steps = len(makeup_plan.get("steps", []))
    await db.commit()

    logger.info(f" Makeup plan generated successfully for session {session_id}")

    # ✅ Return valid Pydantic model
    return MakeupPlan(**makeup_plan)



@router.get("/{session_id}/product-matching", response_model=List[ProductMatch])
async def match_products(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Match needed products with user's vanity
    """
    # Get session
    result = await db.execute(
        select(MakeupSession).where(
            MakeupSession.id == session_id,
            MakeupSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    # Get user's products
    vanity_result = await db.execute(
        select(VanityProduct).where(
            VanityProduct.user_id == current_user.id,
            VanityProduct.is_active == True
        )
    )
    user_products = vanity_result.scalars().all()
    
    # Extract categories needed from makeup plan
    needed_categories = set()
    for step in session.makeup_plan.get("steps", []):
        needed_categories.add(step["category"])
    
    # Match products
    product_matches = []
    for category in needed_categories:
        user_has = any(p.category.value == category for p in user_products)
        
        if user_has:
            matching_product = next((p for p in user_products if p.category.value == category), None)
            product_matches.append(ProductMatch(
                category=category,
                needed=True,
                has_product=True,
                product_id=matching_product.id,
                product_name=f"{matching_product.brand} {matching_product.product_name}",
                is_safe=matching_product.is_safe_for_user,
                safety_warnings=matching_product.safety_warnings
            ))
        else:
            product_matches.append(ProductMatch(
                category=category,
                needed=True,
                has_product=False,
                substitution_available=True,
                substitution_suggestion=f"You can skip {category} or use a similar product"
            ))
    
    return product_matches


@router.post("/{session_id}/complete-step")
async def complete_step(
    session_id: int,
    step_data: StepCompletion,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a step as completed
    """
    result = await db.execute(
        select(MakeupSession).where(
            MakeupSession.id == session_id,
            MakeupSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    # Add step to completed list
    if step_data.step_number not in session.steps_completed:
        session.steps_completed.append(step_data.step_number)
        session.current_step = step_data.step_number + 1
    
    await db.commit()
    
    return {
        "message": "Step completed",
        "current_step": session.current_step,
        "total_steps": session.total_steps,
        "progress_percent": (len(session.steps_completed) / session.total_steps) * 100
    }


@router.post("/{session_id}/report-mistake", response_model=MistakeFix)
async def report_mistake(
    session_id: int,
    mistake_data: MistakeReport,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Report a mistake and get fix suggestions
    """
    result = await db.execute(
        select(MakeupSession).where(
            MakeupSession.id == session_id,
            MakeupSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    # Get fix from LLM
    step_info = next(
        (s for s in session.makeup_plan.get("steps", []) if s["step_number"] == mistake_data.step_number),
        {}
    )
    
    fix = await llm_service.generate_mistake_fix(
        mistake_data.issue_type,
        mistake_data.description or "",
        step_info.get("category", "general")
    )
    
    # Log mistake
    session.mistakes_logged.append({
        "step": mistake_data.step_number,
        "issue": mistake_data.issue_type,
        "description": mistake_data.description,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    await db.commit()
    
    return MistakeFix(**fix)


@router.post("/{session_id}/submit-final", response_model=FinalLookAnalysis)
async def submit_final_look(
    session_id: int,
    final_data: FinalLookSubmit,
    image: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit final makeup look
    """
    result = await db.execute(
        select(MakeupSession).where(
            MakeupSession.id == session_id,
            MakeupSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    # Upload final image if provided
    if image:
        image_bytes = await image.read()
        image_url = await storage_service.upload_result_image(
            image_bytes,
            current_user.id,
            session_id,
            image.content_type
        )
        session.final_image_url = image_url
    
    # Update session
    session.user_rating = final_data.rating
    session.final_feedback = final_data.feedback
    session.status = SessionStatus.COMPLETED
    session.completed_at = datetime.utcnow()
    
    # Calculate duration
    if session.started_at:
        duration = (session.completed_at - session.started_at).total_seconds() / 60
        session.duration_minutes = int(duration)
    
    # Get AI analysis
    analysis = await llm_service.analyze_final_look(
        session.makeup_plan,
        session.accessories_data
    )
    
    # Update user profile stats
    await db.refresh(current_user, ["profile"])
    current_user.profile.total_sessions += 1
    
    await db.commit()
    
    logger.info(f"Session {session_id} completed")
    
    return FinalLookAnalysis(**analysis)


@router.get("/{session_id}", response_model=MakeupSessionResponse)
async def get_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get session details
    """
    result = await db.execute(
        select(MakeupSession).where(
            MakeupSession.id == session_id,
            MakeupSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    return session