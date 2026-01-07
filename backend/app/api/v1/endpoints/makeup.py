"""
GlamAI - Makeup Session Endpoints
Complete makeup session workflow
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.user import User
from app.models.makeup import MakeupSession, SessionStatus,HairRecommendation
from app.schemas.makeup import (
    SessionStart, MakeupSessionResponse,HairRecommendationInput,
    AIRecommendation,ProductRequirement,StepCompletionRequest,
    MakeupPlan, ProductMatch, StepCompletionResponse, MistakeReport,
    MistakeFix, FinalLookSubmit, FinalLookAnalysis,StyleSessionCreate, StyleSessionResponse,HairRecommendationResponse
)
from app.models.user import User, UserStyleSession
from app.api.deps.auth import get_current_user
from app.services.azure.vision_service import vision_service
from app.services.azure.storage_service import storage_service
from app.services.azure.llm_service import llm_service
# from app.services.azure.search_service import search_service
from app.models.vanity import VanityProduct
from datetime import datetime

from datetime import datetime, timezone
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

# @router.get("/{session_id}/hair-suggestion", response_model=HairStyleSuggestion)
# async def get_hair_suggestion(
#     session_id: int,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Get AI hair style suggestion
#     """
#     # Get session
#     result = await db.execute(
#         select(MakeupSession).where(
#             MakeupSession.id == session_id,
#             MakeupSession.user_id == current_user.id
#         )
#     )
#     session = result.scalar_one_or_none()
    
#     if not session:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Session not found"
#         )
    
#     # Get suggestion from LLM
#     outfit_data = {
#         "style": session.outfit_style,
#         "dominant_color": session.outfit_colors[0] if session.outfit_colors else "unknown",
#         "description": session.outfit_description
#     }
    
#     suggestion = await llm_service.generate_hair_style_suggestion(
#         outfit_data,    
#         session.accessories_data,
#         session.occasion.value
#     )
    
#     # Save to session
#     session.hair_style_recommendation = suggestion["recommended_style"]
#     await db.commit()
    
#     return HairStyleSuggestion(**suggestion)


# @router.post("/{session_id}/confirm-hair")
# async def confirm_hair_style(
#     session_id: int,
#     chosen_style: str,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     User confirms chosen hair style
#     """
#     result = await db.execute(
#         select(MakeupSession).where(
#             MakeupSession.id == session_id,
#             MakeupSession.user_id == current_user.id
#         )
#     )
#     session = result.scalar_one_or_none()
    
#     if not session:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
#     session.hair_style_chosen = chosen_style
#     await db.commit()
    
#     return {"message": "Hair style confirmed", "style": chosen_style}


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
# async def generate_makeup_plan(
#     session_id: int,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     💄 Generate a complete makeup plan with AI (LLM + user profile + outfit context)
#     """
#     # 🧾 Fetch session
#     result = await db.execute(
#         select(MakeupSession).where(
#             MakeupSession.id == session_id,
#             MakeupSession.user_id == current_user.id
#         )
#     )
#     session = result.scalar_one_or_none()

#     if not session:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

#     # 👩‍🦰 Fetch user profile
#     await db.refresh(current_user, ["profile"])
#     profile = current_user.profile

#     user_profile_data = {
#         "skin_tone": profile.skin_tone,
#         "undertone": profile.undertone,
#         "skin_type": profile.skin_type,
#         "skin_concerns": profile.skin_concerns,
#         "allergies": profile.allergies
#     }

#     # 👗 Fetch latest style session
#     style_result = await db.execute(
#         select(UserStyleSession)
#         .where(UserStyleSession.user_id == current_user.id)
#         .order_by(UserStyleSession.created_at.desc())
#         .limit(1)
#     )
#     style_session = style_result.scalar_one_or_none()

#     if not style_session:
#         raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Please create a style session first.")

#     outfit_data = {
#         "refined_description": style_session.outfit_description,
#         "outfit_type": style_session.outfit_type,
#         "colors": style_session.outfit_colors,
#         "dominant_color": style_session.outfit_colors[0] if style_session.outfit_colors else "unknown"
#     }

#     accessories_data = style_session.accessories

#     # 💡 Generate plan using LLM
#     makeup_plan = await llm_service.generate_makeup_plan(
#         user_profile_data,
#         session.occasion.value,
#         session.scope.value,
#         outfit_data,
#         accessories_data
#     )

#     # 🩵 Inject occasion and scope if LLM missed them
#     if "occasion" not in makeup_plan:
#         makeup_plan["occasion"] = session.occasion.value
#     if "scope" not in makeup_plan:
#         makeup_plan["scope"] = session.scope.value

#     # 💾 Save to database
#     session.makeup_plan = makeup_plan
#     session.total_steps = len(makeup_plan.get("steps", []))
#     await db.commit()

#     logger.info(f" Makeup plan generated successfully for session {session_id}")

#     # ✅ Return valid Pydantic model
#     return MakeupPlan(**makeup_plan)
async def generate_makeup_plan(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    💄 STEP 1: Generate a complete makeup plan with AI
    
    This function:
    1. Fetches user session and validates
    2. Loads user profile (skin tone, type, concerns, allergies)
    3. Loads outfit context from latest style session
    4. Generates AI-powered makeup plan
    5. Extracts detailed product requirements
    6. Saves plan to database
    """
    
    logger.info(f"🎨 Starting makeup plan generation for session {session_id}")
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 1.1: Fetch and validate session
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
    
    logger.info(f"✅ Session found: {session.occasion.value} - {session.scope.value}")
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 1.2: Load user profile with all beauty-related data
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    await db.refresh(current_user, ["profile"])
    profile = current_user.profile
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User profile not found. Please complete your beauty profile first."
        )
    
    user_profile_data = {
        "skin_tone": profile.skin_tone,
        "undertone": profile.undertone,
        "skin_type": profile.skin_type,
        "skin_concerns": profile.skin_concerns or [],
        "allergies": profile.allergies or [],
        "eye_color": getattr(profile, "eye_color", None),
        "hair_color": getattr(profile, "hair_color", None),
        "preferred_coverage": getattr(profile, "preferred_coverage", "medium")
    }
    
    logger.info(f"👤 User profile loaded: {profile.skin_tone} with {profile.undertone} undertone")
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 1.3: Fetch latest outfit/style context
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    style_result = await db.execute(
        select(UserStyleSession)
        .where(UserStyleSession.user_id == current_user.id)
        .order_by(UserStyleSession.created_at.desc())
        .limit(1)
    )
    style_session = style_result.scalar_one_or_none()
    
    if not style_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please create a style session first to match makeup with your outfit."
        )
    
    outfit_data = {
        "refined_description": style_session.outfit_description,
        "outfit_type": style_session.outfit_type,
        "colors": style_session.outfit_colors or [],
        "dominant_color": style_session.outfit_colors[0] if style_session.outfit_colors else "neutral",
        "formality_level": getattr(style_session, "formality_level", "casual")
    }
    
    accessories_data = style_session.accessories or []
    
    logger.info(f"👗 Outfit context loaded: {outfit_data['outfit_type']} in {outfit_data['dominant_color']}")
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 1.4: Generate AI makeup plan
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    logger.info("🤖 Calling LLM service to generate makeup plan...")
    
    makeup_plan = await llm_service.generate_makeup_plan(
        user_profile_data,
        session.occasion.value,
        session.scope.value,
        outfit_data,
        accessories_data
    )
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 1.5: Enhance plan with metadata
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if "occasion" not in makeup_plan:
        makeup_plan["occasion"] = session.occasion.value
    if "scope" not in makeup_plan:
        makeup_plan["scope"] = session.scope.value
    
    # Calculate total duration
    total_duration = sum(step.get("duration_minutes", 5) for step in makeup_plan.get("steps", []))
    makeup_plan["total_duration_minutes"] = total_duration
    
    # Determine difficulty
    step_count = len(makeup_plan.get("steps", []))
    if step_count <= 5:
        makeup_plan["difficulty_level"] = "beginner"
    elif step_count <= 10:
        makeup_plan["difficulty_level"] = "intermediate"
    else:
        makeup_plan["difficulty_level"] = "advanced"
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 1.6: Extract detailed product requirements
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    product_requirements = []
    seen_categories = set()
    
    for step in makeup_plan.get("steps", []):
        category = step.get("category")
        if category and category not in seen_categories:
            seen_categories.add(category)
            
            product_req = ProductRequirement(
                category=category,
                specific_type=step.get("product_type", category),
                shade_requirement=step.get("shade_needed"),
                finish_type=step.get("finish_type"),
                priority=step.get("priority", "required"),
                alternative_options=step.get("alternatives", []),
                usage_tips=step.get("tips", "")
            )
            product_requirements.append(product_req)
    
    makeup_plan["product_requirements"] = [req.dict() for req in product_requirements]
    
    logger.info(f"📦 Extracted {len(product_requirements)} product requirements")
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 1.7: Save to database
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    session.makeup_plan = makeup_plan
    session.total_steps = len(makeup_plan.get("steps", []))
    session.steps_completed = []
    session.current_step = 1
    
    await db.commit()
    await db.refresh(session)
    
    logger.info(f"✅ Makeup plan saved successfully with {session.total_steps} steps")
    
    return MakeupPlan(**makeup_plan)



@router.get("/{session_id}/product-matching", response_model=List[ProductMatch])
# async def match_products(
#     session_id: int,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Match needed products with user's vanity
#     """
#     # Get session
#     result = await db.execute(
#         select(MakeupSession).where(
#             MakeupSession.id == session_id,
#             MakeupSession.user_id == current_user.id
#         )
#     )
#     session = result.scalar_one_or_none()
    
#     if not session:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
#     # Get user's products
#     vanity_result = await db.execute(
#         select(VanityProduct).where(
#             VanityProduct.user_id == current_user.id,
#             VanityProduct.is_active == True
#         )
#     )
#     user_products = vanity_result.scalars().all()
    
#     # Extract categories needed from makeup plan
#     needed_categories = set()
#     for step in session.makeup_plan.get("steps", []):
#         needed_categories.add(step["category"])
    
#     # Match products
#     product_matches = []
#     for category in needed_categories:
#         user_has = any(p.category.value == category for p in user_products)
        
#         if user_has:
#             matching_product = next((p for p in user_products if p.category.value == category), None)
#             product_matches.append(ProductMatch(
#                 category=category,
#                 needed=True,
#                 has_product=True,
#                 product_id=matching_product.id,
#                 product_name=f"{matching_product.brand} {matching_product.product_name}",
#                 is_safe=matching_product.is_safe_for_user,
#                 safety_warnings=matching_product.safety_warnings
#             ))
#         else:
#             product_matches.append(ProductMatch(
#                 category=category,
#                 needed=True,
#                 has_product=False,
#                 substitution_available=True,
#                 substitution_suggestion=f"You can skip {category} or use a similar product"
#             ))
    
#     return product_matches
async def match_products(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    🔍 STEP 2: Match needed products with user's vanity
    
    This function:
    1. Gets the makeup plan and extracts product requirements
    2. Fetches all active products from user's vanity
    3. Performs intelligent matching with safety checks
    4. Calculates suitability scores
    5. Identifies missing products
    6. Suggests alternatives and shopping recommendations
    """
    
    logger.info(f"🔍 Starting product matching for session {session_id}")
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 2.1: Get session and validate plan exists
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
    
    if not session.makeup_plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please generate a makeup plan first"
        )
    
    logger.info(f"✅ Session found with {session.total_steps} steps")
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 2.2: Fetch user's vanity products
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    vanity_result = await db.execute(
        select(VanityProduct).where(
            VanityProduct.user_id == current_user.id,
            VanityProduct.is_active == True
        )
    )
    user_products = vanity_result.scalars().all()
    
    logger.info(f"👜 Found {len(user_products)} active products in vanity")
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 2.3: Extract product requirements from plan
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    product_requirements = session.makeup_plan.get("product_requirements", [])
    
    if not product_requirements:
        # Fallback: extract from steps
        logger.warning("No product_requirements found, extracting from steps")
        seen_categories = set()
        product_requirements = []
        
        for step in session.makeup_plan.get("steps", []):
            category = step.get("category")
            if category and category not in seen_categories:
                seen_categories.add(category)
                product_requirements.append({
                    "category": category,
                    "specific_type": step.get("product_type", category),
                    "priority": "required"
                })
    
    logger.info(f"📋 Processing {len(product_requirements)} product requirements")
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 2.4: Match each requirement with user's products
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    product_matches = []
    
    for req in product_requirements:
        category = req.get("category", "").lower()
        logger.info(f"   🔎 Matching category: {category}")
        
        # Find matching products in vanity
        matching_products = [
            p for p in user_products 
            if p.category.value.lower() == category
        ]
        
        if matching_products:
            # User has products in this category
            # Pick the best one (prioritize safe, recently used)
            best_product = max(
                matching_products,
                key=lambda p: (
                    p.is_safe_for_user,
                    0 if not p.expiry_date else (p.expiry_date - utc_now()).days,
                    0 if not p.last_used else -(utc_now() - p.last_used).days
                )
            )
            
            # Calculate suitability score
            suitability_score = _calculate_suitability_score(
                best_product,
                req,
                session.makeup_plan
            )
            
            suitability_reasons = _get_suitability_reasons(
                best_product,
                req,
                suitability_score
            )
            
            # Check expiry status
            expiry_status = _get_expiry_status(best_product)
            
            match = ProductMatch(
                category=category,
                needed=True,
                has_product=True,
                product_id=best_product.id,
                product_name=best_product.product_name,
                brand=best_product.brand,
                shade=getattr(best_product, "shade", None),
                finish=getattr(best_product, "finish", None),
                is_safe=best_product.is_safe_for_user,
                safety_warnings=best_product.safety_warnings or [],
                expiry_status=expiry_status,
                last_used=best_product.last_used.isoformat() if best_product.last_used else None,
                suitability_score=suitability_score,
                suitability_reasons=suitability_reasons,
                substitution_available=len(matching_products) > 1,
                substitution_suggestions=[
                    f"{p.brand} {p.product_name}" 
                    for p in matching_products[:3] if p.id != best_product.id
                ],
                need_to_buy=False
            )
            
            logger.info(f"      ✅ Matched: {best_product.brand} {best_product.product_name} (score: {suitability_score})")
            
        else:
            # User doesn't have this product - needs to buy
            match = ProductMatch(
                category=category,
                needed=True,
                has_product=False,
                need_to_buy=True,
                substitution_available=True,
                substitution_suggestions=req.get("alternative_options", [
                    f"Any {category} suitable for {session.occasion.value}"
                ]),
                recommended_products=_get_shopping_recommendations(
                    category,
                    req,
                    session.makeup_plan
                ),
                estimated_price_range=_estimate_price_range(category)
            )
            
            logger.info(f"      ❌ Missing: {category} - Need to buy")
        
        product_matches.append(match)
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 2.5: Log summary
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    matched_count = sum(1 for m in product_matches if m.has_product)
    missing_count = len(product_matches) - matched_count
    
    logger.info(f"✅ Product matching complete: {matched_count} matched, {missing_count} missing")
    
    return product_matches

# @router.post("/{session_id}/complete-step")
# async def complete_step(
#     session_id: int,
#     step_data: StepCompletion,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Mark a step as completed
#     """
#     result = await db.execute(
#         select(MakeupSession).where(
#             MakeupSession.id == session_id,
#             MakeupSession.user_id == current_user.id
#         )
#     )
#     session = result.scalar_one_or_none()
    
#     if not session:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
#     # Add step to completed list
#     if step_data.step_number not in session.steps_completed:
#         session.steps_completed.append(step_data.step_number)
#         session.current_step = step_data.step_number + 1
    
#     await db.commit()
    
#     return {
#         "message": "Step completed",
#         "current_step": session.current_step,
#         "total_steps": session.total_steps,
#         "progress_percent": (len(session.steps_completed) / session.total_steps) * 100
#     }
@router.post("/{session_id}/complete-step", response_model=StepCompletionResponse)
async def complete_step(
    session_id: int,
    step_data: StepCompletionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    ✅ STEP 3: Mark a step as completed with progress tracking
    
    This function:
    1. Validates the step completion
    2. Updates session progress
    3. Tracks products used
    4. Provides next step preview
    5. Calculates remaining time
    6. Detects completion of entire session
    """
    
    logger.info(f"✅ Marking step {step_data.step_number} as complete for session {session_id}")
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 3.1: Fetch and validate session
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
    
    if not session.makeup_plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No makeup plan found for this session"
        )
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 3.2: Validate step number
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if step_data.step_number < 1 or step_data.step_number > session.total_steps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid step number. Must be between 1 and {session.total_steps}"
        )
    
    if step_data.step_number in session.steps_completed:
        logger.warning(f"⚠️ Step {step_data.step_number} already completed")
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 3.3: Update completion status
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if step_data.step_number not in session.steps_completed:
        session.steps_completed.append(step_data.step_number)
        session.steps_completed.sort()
    
    # Update current step to next uncompleted step
    all_steps = set(range(1, session.total_steps + 1))
    completed_steps = set(session.steps_completed)
    remaining_steps = sorted(all_steps - completed_steps)
    
    if remaining_steps:
        session.current_step = remaining_steps[0]
    else:
        session.current_step = session.total_steps + 1  # All done!
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 3.4: Track products used
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    steps = session.makeup_plan.get("steps", [])
    completed_step = steps[step_data.step_number - 1] if step_data.step_number <= len(steps) else {}
    
    products_used = []
    if "products" in completed_step:
        products_used = completed_step["products"]
    elif "category" in completed_step:
        products_used = [completed_step["category"]]
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 3.5: Calculate progress
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    progress_percent = (len(session.steps_completed) / session.total_steps) * 100
    all_steps_complete = len(session.steps_completed) >= session.total_steps
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 3.6: Get next step preview
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    next_step_preview = None
    estimated_time_remaining = 0
    
    if not all_steps_complete and session.current_step <= len(steps):
        next_step = steps[session.current_step - 1]
        next_step_preview = {
            "step_number": session.current_step,
            "title": next_step.get("title", f"Step {session.current_step}"),
            "category": next_step.get("category"),
            "duration_minutes": next_step.get("duration_minutes", 5),
            "description": next_step.get("description", "")[:100] + "..."
        }
        
        # Calculate time remaining
        for step_num in remaining_steps:
            if step_num <= len(steps):
                estimated_time_remaining += steps[step_num - 1].get("duration_minutes", 5)
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 3.7: Mark session as complete if all steps done
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    session_complete = False
    if all_steps_complete:
        session.status = "completed"
        session.completed_at = utc_now()

        session_complete = True
        logger.info(f"🎉 Session {session_id} marked as complete!")
    
    await db.commit()
    await db.refresh(session)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STEP 3.8: Build response
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    message = f"✅ Step {step_data.step_number} completed successfully!"
    if session_complete:
        message = "🎉 Congratulations! You've completed your entire makeup routine!"
    
    logger.info(f"✅ Step completion saved: {step_data.step_number}/{session.total_steps}")
    
    return StepCompletionResponse(
        message=message,
        step_completed=step_data.step_number,
        current_step=session.current_step,
        total_steps=session.total_steps,
        progress_percent=round(progress_percent, 2),
        next_step_preview=next_step_preview,
        estimated_time_remaining=estimated_time_remaining if not session_complete else 0,
        products_used=products_used,
        all_steps_complete=all_steps_complete,
        session_complete=session_complete
    )


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
        "timestamp": utc_now().isoformat()
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
    session.completed_at = utc_now()

    
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



# '''''''''''''''''''''Hair"'''''''''''''''''''''''''''''

@router.post("/hair-suggest", response_model=HairRecommendationResponse)
async def get_hair_suggestion(
    input_data: HairRecommendationInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Direct endpoint: User inputs outfit details and gets instant AI recommendation
    This is the main endpoint users hit after login
    """
    try:
        # Get AI recommendation instantly
        ai_suggestion = await llm_service.generate_hair_style_suggestion(
            outfit_description=input_data.outfit_description,
            outfit_style=input_data.outfit_style,
            occasion=input_data.occasion,
            face_shape=input_data.face_shape.value if input_data.face_shape else None,
            hair_texture=input_data.hair_texture.value if input_data.hair_texture else None,
            hair_length=input_data.hair_length.value if input_data.hair_length else None
        )
        
        # Save to database for history
        hair_rec = HairRecommendation(
            user_id=current_user.id,
            outfit_description=input_data.outfit_description,
            outfit_style=input_data.outfit_style,
            occasion=input_data.occasion,
            face_shape=input_data.face_shape.value if input_data.face_shape else None,
            hair_texture=input_data.hair_texture.value if input_data.hair_texture else None,
            hair_length=input_data.hair_length.value if input_data.hair_length else None,
            recommended_style=ai_suggestion["recommended_style"],
            style_attributes=ai_suggestion.get("style_attributes", []),
            reasoning=ai_suggestion.get("benefits", []),
            alternatives=ai_suggestion.get("alternatives", []),
            styling_tips=ai_suggestion.get("styling_tips", [])
        )
        
        db.add(hair_rec)
        await db.commit()
        await db.refresh(hair_rec)
        
        # Return formatted response immediately
        return HairRecommendationResponse(
            id=hair_rec.id,
            recommended_style=hair_rec.recommended_style,
            style_attributes=hair_rec.style_attributes,
            benefits=hair_rec.reasoning,
            alternatives=hair_rec.alternatives,
            styling_tips=hair_rec.styling_tips,
            maintenance_level=ai_suggestion.get("maintenance_level")
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendation: {str(e)}"
        )


# @router.get("/history", response_model=List[HairRecommendationResponse])
# async def get_my_recommendations(
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db),
#     limit: int = 20
# ):
#     """
#     Get user's past hair recommendations
#     Optional: View history of previous suggestions
#     """
#     result = await db.execute(
#         select(HairRecommendation)
#         .where(HairRecommendation.user_id == current_user.id)
#         .order_by(HairRecommendation.id.desc())
#         .limit(limit)
#     )
#     recommendations = result.scalars().all()
    
#     return [
#         HairRecommendationResponse(
#             id=rec.id,
#             recommended_style=rec.recommended_style,
#             style_attributes=rec.style_attributes,
#             benefits=rec.reasoning,
#             alternatives=rec.alternatives,
#             styling_tips=rec.styling_tips,
#             maintenance_level=None
#         )
#         for rec in recommendations
#     ]


# @router.delete("/{recommendation_id}")
# async def delete_recommendation(
#     recommendation_id: int,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Delete a specific recommendation from history
#     """
#     result = await db.execute(
#         select(HairRecommendation).where(
#             HairRecommendation.id == recommendation_id,
#             HairRecommendation.user_id == current_user.id
#         )
#     )
#     recommendation = result.scalar_one_or_none()
    
#     if not recommendation:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Recommendation not found"
#         )
    
#     await db.delete(recommendation)
#     await db.commit()
    
#     return {"message": "Recommendation deleted successfully"}


def utc_now():
    return datetime.now(timezone.utc)

# ============================================================================
# HELPER FUNCTIONS (ADD THESE AT THE END OF YOUR FILE)
# ============================================================================

def _calculate_suitability_score(
    product: VanityProduct,
    requirement: Dict,
    makeup_plan: Dict           
) -> float:
    """
    Calculate how suitable a product is for the current makeup plan.
    Score from 0-100.
    
    Args:
        product: The VanityProduct to evaluate
        requirement: Product requirement dict with category, shade, finish info
        makeup_plan: The complete makeup plan dict
        
    Returns:
        float: Suitability score from 0-100
    """
    score = 50.0  # Base score
    
    # ✅ Safety check (most important)
    if product.is_safe_for_user:
        score += 30.0
    else:
        score -= 40.0
    
    # ✅ Expiry check
    if product.expiry_date:
        days_until_expiry = (product.expiry_date - utc_now()).days
        if days_until_expiry > 180:  # 6+ months
            score += 10.0
        elif days_until_expiry > 90:  # 3-6 months
            score += 5.0
        elif days_until_expiry <= 0:  # Expired
            score -= 30.0
        else:  # Expiring soon
            score -= 10.0
    
    # ✅ Recent usage bonus
    if product.last_used:
        days_since_used = (utc_now() - product.last_used).days
        if days_since_used <= 7:
            score += 5.0
        elif days_since_used <= 30:
            score += 3.0
    
    # ✅ Shade/finish matching
    shade_needed = requirement.get("shade_requirement")
    if shade_needed and hasattr(product, "shade"):
        if product.shade and shade_needed.lower() in product.shade.lower():
            score += 10.0
    
    finish_needed = requirement.get("finish_type")
    if finish_needed and hasattr(product, "finish"):
        if product.finish and finish_needed.lower() in product.finish.lower():
            score += 5.0
    
    # ✅ Brand quality (if tracked)
    if hasattr(product, "is_high_end") and product.is_high_end:
        score += 3.0
    
    # Clamp score between 0 and 100
    return max(0.0, min(100.0, score))


def _get_suitability_reasons(
    product: VanityProduct,
    requirement: Dict,
    score: float
) -> List[str]:
    """
    Generate human-readable reasons for the suitability score.
    
    Args:
        product: The VanityProduct being evaluated
        requirement: Product requirement dict
        score: The calculated suitability score
        
    Returns:
        List[str]: List of reason strings explaining the score
    """
    reasons = []
    
    # Overall assessment
    if score >= 80:
        reasons.append("Excellent match for your needs")
    elif score >= 60:
        reasons.append("Good match with minor considerations")
    elif score >= 40:
        reasons.append("Acceptable but not ideal")
    else:
        reasons.append("Not recommended for this look")
    
    # Safety assessment
    if product.is_safe_for_user:
        reasons.append("Safe for your skin profile")
    else:
        reasons.append("⚠️ May contain ingredients you're sensitive to")
    
    # Expiry assessment
    if product.expiry_date:
        days_until_expiry = (product.expiry_date - utc_now()).days
        if days_until_expiry <= 0:
            reasons.append("⚠️ Product has expired")
        elif days_until_expiry <= 30:
            reasons.append("⚠️ Expiring soon")
        elif days_until_expiry > 180:
            reasons.append("Fresh product with good shelf life")
    
    # Usage history
    if product.last_used:
        days_since_used = (utc_now() - product.last_used).days
        if days_since_used <= 7:
            reasons.append("Recently used by you")
    
    return reasons


def _get_expiry_status(product: VanityProduct) -> str:
    """
    Get expiry status: fresh, expiring_soon, expired, or unknown.
    
    Args:
        product: The VanityProduct to check
        
    Returns:
        str: One of "fresh", "expiring_soon", "expired", "unknown"
    """
    if not product.expiry_date:
        return "unknown"
    
    days_until_expiry = (product.expiry_date - utc_now()).days
    
    if days_until_expiry <= 0:
        return "expired"
    elif days_until_expiry <= 30:
        return "expiring_soon"
    else:
        return "fresh"


def _get_shopping_recommendations(
    category: str,
    requirement: Dict,
    makeup_plan: Dict
) -> List[Dict]:
    """
    Generate shopping recommendations for missing products.
    
    Args:
        category: Product category (e.g., "foundation", "lipstick")
        requirement: Product requirement dict with details
        makeup_plan: The complete makeup plan
        
    Returns:
        List[Dict]: List of recommendation dictionaries
    """
    recommendations = []
    
    # Generic recommendations based on category
    price_ranges = {
        "foundation": ("$15-$60", "drugstore to high-end"),
        "concealer": ("$10-$35", "affordable options available"),
        "powder": ("$10-$50", "wide range available"),
        "blush": ("$8-$45", "many excellent drugstore options"),
        "bronzer": ("$10-$50", "suitable for all budgets"),
        "highlighter": ("$8-$40", "from affordable to luxury"),
        "eyeshadow": ("$15-$60", "palettes offer best value"),
        "eyeliner": ("$5-$30", "excellent drugstore options"),
        "mascara": ("$8-$35", "drugstore often equals high-end"),
        "lipstick": ("$6-$40", "wide variety available"),
        "lip_gloss": ("$5-$30", "many affordable options"),
        "setting_spray": ("$10-$40", "essential for longevity"),
        "primer": ("$10-$50", "creates smooth base"),
        "eyebrow": ("$8-$30", "frames your face"),
        "contour": ("$12-$45", "adds dimension")
    }
    
    category_clean = category.lower().replace(" ", "_")
    price_info = price_ranges.get(category_clean, ("$10-$50", "varies by brand"))
    
    recommendations.append({
        "type": category,
        "priority": requirement.get("priority", "required"),
        "estimated_price": price_info[0],
        "note": price_info[1],
        "where_to_buy": ["Sephora", "Ulta", "drugstores", "online retailers"],
        "suggestion": f"Look for {requirement.get('specific_type', category)} suitable for {makeup_plan.get('occasion', 'your event')}"
    })
    
    return recommendations


def _estimate_price_range(category: str) -> str:
    """
    Estimate price range for a product category.
    
    Args:
        category: Product category name
        
    Returns:
        str: Price range string like "$10-$50"
    """
    price_map = {
        "foundation": "$15-$60",
        "concealer": "$10-$35",
        "powder": "$10-$50",
        "blush": "$8-$45",
        "bronzer": "$10-$50",
        "highlighter": "$8-$40",
        "eyeshadow": "$15-$60",
        "eyeliner": "$5-$30",
        "mascara": "$8-$35",
        "lipstick": "$6-$40",
        "lip_gloss": "$5-$30",
        "setting_spray": "$10-$40",
        "primer": "$10-$50",
        "eyebrow": "$8-$30",
        "contour": "$12-$45",
        "brow_gel": "$6-$25",
        "lip_liner": "$5-$25",
        "setting_powder": "$10-$50"
    }
    
    category_clean = category.lower().replace(" ", "_")
    return price_map.get(category_clean, "$10-$50")


# ============================================================================
# ADDITIONAL UTILITY ENDPOINTS
# ============================================================================

# @router.get("/{session_id}/progress", response_model=Dict)
# async def get_session_progress(
#     session_id: int,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Get detailed progress information for a makeup session.
    
#     Returns comprehensive progress tracking including completion status,
#     percentages, and timestamps.
#     """
#     result = await db.execute(
#         select(MakeupSession).where(
#             MakeupSession.id == session_id,
#             MakeupSession.user_id == current_user.id
#         )
#     )
#     session = result.scalar_one_or_none()
    
#     if not session:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Session not found"
#         )
    
#     progress_percent = (len(session.steps_completed) / session.total_steps * 100) if session.total_steps > 0 else 0
    
#     return {
#         "session_id": session.id,
#         "status": session.status,
#         "current_step": session.current_step,
#         "total_steps": session.total_steps,
#         "steps_completed": session.steps_completed,
#         "progress_percent": round(progress_percent, 2),
#         "is_complete": len(session.steps_completed) >= session.total_steps,
#         "created_at": session.created_at.isoformat(),
#         "completed_at": session.completed_at.isoformat() if session.completed_at else None
#     }


# @router.post("/{session_id}/reset-progress")
# async def reset_session_progress(
#     session_id: int,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Reset progress for a session (restart the makeup routine).
    
#     This allows users to start over if they want to redo their makeup
#     or practice the routine again.
#     """
#     result = await db.execute(
#         select(MakeupSession).where(
#             MakeupSession.id == session_id,
#             MakeupSession.user_id == current_user.id
#         )
#     )
#     session = result.scalar_one_or_none()
    
#     if not session:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Session not found"
#         )
    
#     session.steps_completed = []
#     session.current_step = 1
#     session.status = "in_progress"
#     session.completed_at = None
    
#     await db.commit()
    
#     logger.info(f"🔄 Session {session_id} progress reset")
    
#     return {
#         "message": "Session progress reset successfully",
#         "session_id": session.id,
#         "current_step": session.current_step,
#         "total_steps": session.total_steps
#     }


# @router.get("/{session_id}/shopping-list", response_model=Dict)
# async def get_shopping_list(
#     session_id: int,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Generate a shopping list of missing products.
    
#     This endpoint analyzes the makeup plan and user's vanity to create
#     a comprehensive shopping list with price estimates and recommendations.
#     """
#     # Get product matches
#     product_matches = await match_products(session_id, current_user, db)
    
#     # Filter to only missing products
#     missing_products = [
#         match for match in product_matches 
#         if match.need_to_buy
#     ]
    
#     total_estimated_min = 0
#     total_estimated_max = 0
    
#     shopping_list = []
#     for match in missing_products:
#         item = {
#             "category": match.category,
#             "priority": "high" if "required" in str(match.category).lower() else "medium",
#             "estimated_price": match.estimated_price_range,
#             "alternatives": match.substitution_suggestions,
#             "recommendations": match.recommended_products
#         }
#         shopping_list.append(item)
        
#         # Parse price range
#         if match.estimated_price_range:
#             try:
#                 prices = match.estimated_price_range.replace("$", "").split("-")
#                 total_estimated_min += float(prices[0])
#                 total_estimated_max += float(prices[1])
#             except:
#                 pass
    
#     return {
#         "session_id": session_id,
#         "missing_products_count": len(missing_products),
#         "shopping_list": shopping_list,
#         "estimated_total": f"${total_estimated_min:.0f}-${total_estimated_max:.0f}" if missing_products else "$0",
#         "shopping_tips": [
#             "Check for sales and promotions",
#             "Consider drugstore alternatives for budget-friendly options",
#             "Read reviews before purchasing",
#             "Test products in-store when possible",
#             "Start with essentials and add extras later"
#         ]
#     }
