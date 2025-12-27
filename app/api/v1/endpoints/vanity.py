"""
GlamAI - Vanity (Product Inventory) Endpoints
Smart Makeup Product Management with AI Enrichment
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
import io
import json, logging
from app.models.user import User, UserProfile
from app.models.vanity import VanityProduct, ProductCategory
from app.schemas.vanity import (
    VanityProductCreate, VanityProductUpdate, VanityProductResponse,
    VanityListResponse, ProductSafetyCheck
)
from app.api.deps.auth import db_refresh
from sqlalchemy import text
import asyncio
# from app.api.deps.user_profile import get_user_profile, db_refresh3
from fastapi import Request
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from app.api.deps.auth import get_current_user
from app.services.azure.llm_service import llm_service
from app.services.azure.search_service import search_service
from app.services.azure.storage_service import storage_service
from typing import List, Optional
from datetime import datetime
from app.api.deps import auth
from app import db
from openai import AsyncOpenAI
from loguru import logger
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Vanity | Products"])
@router.post("/test-scan", response_model=dict)
async def test_scan(file: UploadFile = File(...)):
    return {"filename": file.filename}
# ======================================================
# 🧠 1️⃣ Smart Add Product
# ======================================================
@router.post("/products", response_model=VanityProductResponse, status_code=status.HTTP_201_CREATED)
async def add_product(
    product_data: VanityProductCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add a new product to user's vanity.
    💄 Now enhanced with:
    - AI enrichment (auto-fills missing data)
    - AI-based safety check
    - Optional Azure Search match
    """

    await db.refresh(current_user, ["profile"])
    profile = current_user.profile

    # 🧠 Step 1: Enrich missing fields using AI
    if not product_data.category or not product_data.shade:
        enrichment_prompt = f"""
Extract and enrich product info for:
Brand: {product_data.brand or "Unknown"}
Product: {product_data.product_name}
Shade: {product_data.shade or "N/A"}

Return JSON:
{{
  "category": "foundation|lipstick|primer|other",
  "shade": "light beige|ruby red|N/A",
  "tags": ["matte", "hydrating", "longwear"]
}}
"""
        enrichment = await llm_service.get_structured_response(
            prompt=enrichment_prompt,
            system_role="cosmetic_expert",
            max_tokens=300
        )

        if enrichment:
            product_data.category = ProductCategory(enrichment.get("category", "other"))
            product_data.shade = enrichment.get("shade", product_data.shade)
            product_data.tags = enrichment.get("tags", product_data.tags)

    # 🧩 Step 2: Create product entry
    new_product = VanityProduct(
        user_id=current_user.id,
        category=product_data.category,
        brand=product_data.brand,
        product_name=product_data.product_name,
        shade=product_data.shade,
        price=product_data.price,
        purchase_date=product_data.purchase_date,
        expiry_date=product_data.expiry_date,
        notes=product_data.notes,
        tags=product_data.tags or []
    )

    # 🧴 Step 3: Run safety check
    if product_data.ingredients:
        safety_check = await llm_service.check_product_safety(
            product_name=product_data.product_name,
            product_ingredients=product_data.ingredients,
            user_profile={
                "allergies": profile.allergies or [],
                "skin_concerns": [c.get("type", "") for c in profile.skin_concerns or []],
                "skin_type": profile.skin_type,
                "skin_tone": profile.skin_tone,
                "undertone": profile.undertone
            }
        )
        new_product.ingredients = product_data.ingredients
        new_product.is_safe_for_user = safety_check["is_safe"]
        new_product.safety_warnings = safety_check["warnings"]

    # 🧬 Step 4: Try to fetch from Azure Search (auto-enrichment)
    matches = await search_service.search_products(
        category=product_data.category.value,
        user_profile={
            "skin_tone": profile.skin_tone,
            "undertone": profile.undertone,
            "skin_type": profile.skin_type
        },
        query=f"{product_data.brand} {product_data.product_name}",
        enrich_results=False,
        top=1
    )

    if matches:
        match = matches[0]
        new_product.product_image_url = match.get("image_url")
        new_product.price = new_product.price or match.get("price")
        new_product.rating = match.get("average_rating")
        new_product.tags = list(set(new_product.tags + match.get("tags", [])))

    # Save to DB
    db.add(new_product)
    current_user.profile.products_count += 1

    await db.commit()
    await db.refresh(new_product)

    logger.info(f"✨ Product added & enriched: {new_product.product_name}")
    return new_product


# ======================================================
# 📸 2️⃣ Product Scanning (AI Vision Placeholder)
# ======================================================
def run_ocr_and_ai(image_bytes: bytes):
    """Run OCR with Azure Form Recognizer + AI label parsing."""

    # 🧩 1️⃣ Verify bytes
    if not image_bytes or len(image_bytes) < 500:
        logger.error("❌ Uploaded image file is empty or too small.")
        return empty_product_json()

    try:
        # 🧩 2️⃣ Prepare in-memory buffer
        buffer = io.BytesIO(image_bytes)
        buffer.seek(0)

        # 🧩 3️⃣ Azure OCR client
        ocr_client = DocumentAnalysisClient(
            endpoint=settings.AZURE_FORM_RECOGNIZER_ENDPOINT,
            credential=AzureKeyCredential(settings.AZURE_FORM_RECOGNIZER_KEY)
        )

        # 🧠 Force content type for reliability
        poller = ocr_client.begin_analyze_document(
            "prebuilt-read",
            document=buffer,
            content_type="image/png"
        )
        result = poller.result()

        # 🧩 4️⃣ Collect text from OCR
        extracted_text = " ".join(
            [line.content for page in result.pages for line in page.lines]
        ) if result and result.pages else ""

        logger.info(f"📜 OCR Extracted {len(extracted_text)} chars")

        # If OCR returned empty — bail early
        if not extracted_text.strip():
            logger.warning("⚠️ OCR returned no readable text from image.")
            return empty_product_json()

    except Exception as e:
        logger.error(f"❌ OCR processing failed: {e}")
        return empty_product_json()

    # 🧩 5️⃣ Now run AI structuring on OCR text
    try:
        prompt = f"""
You are a cosmetic product label reader.
Extract structured information from the text below.

Text:
{extracted_text}

Return JSON:
{{
  "brand": "",
  "product_name": "",
  "shade": "",
  "category": "",
  "description": "",
  "tags": [],
  "price": null,
  "ingredients": []
}}
"""

        llm_client = AsyncOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            base_url=settings.AZURE_OPENAI_BASE_URL,
            default_query={"api-version": settings.AZURE_OPENAI_API_VERSION}
        )

        response =llm_client.chat.completions.create(
            model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": "You are an expert at parsing cosmetic product labels."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=700,
            response_format={"type": "json_object"}
        )

        structured_data = json.loads(response.choices[0].message.content)
        logger.info(f"✅ Structured product data extracted: {structured_data}")
        return structured_data

    except Exception as e:
        logger.error(f"❌ AI parsing failed: {e}")
        return empty_product_json()


def empty_product_json():
    return {
        "brand": "",
        "product_name": "",
        "shade": "",
        "category": "OTHER",
        "description": "",
        "tags": [],
        "price": None,
        "ingredients": []
    }

@router.post("/debug-ocr")
async def debug_ocr(file: UploadFile = File(...)):
    from azure.ai.formrecognizer import DocumentAnalysisClient
    from azure.core.credentials import AzureKeyCredential
    from app.core.config import settings
    import io

    image_bytes = await file.read()
    logger.info(f"📦 Received {len(image_bytes)} bytes from upload.")

    buffer = io.BytesIO(image_bytes)
    buffer.seek(0)

    client = DocumentAnalysisClient(
        endpoint=settings.AZURE_FORM_RECOGNIZER_ENDPOINT,
        credential=AzureKeyCredential(settings.AZURE_FORM_RECOGNIZER_KEY)
    )

    poller = client.begin_analyze_document("prebuilt-read", document=buffer)  # ✅ No content_type
    result = poller.result()

    lines = [line.content for page in result.pages for line in page.lines]
    logger.info(f"🧠 OCR Extracted {len(lines)} lines")

    return {"total_lines": len(lines), "sample": lines[:15]}



@router.post("/products/scan", response_model=dict)
async def scan_product(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...)
):
    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image uploaded")

    # Upload to Azure Blob
    image_url = await storage_service._upload_image(
        image_bytes=image_bytes,
        container_name="results",
        prefix=f"user_{current_user.id}_product",
        content_type=file.content_type or "image/png"
    )

    logger.info(f"📤 Uploaded image: {image_url}")
    logger.info(f"Uploaded {len(image_bytes)} bytes; first 50 bytes: {image_bytes[:50]}")


    # ✅ OCR + LLM extraction (no to_thread needed)
    structured_data = await asyncio.to_thread(run_ocr_and_ai, image_bytes)


    # ✅ Fallback safety data
    ingredients = structured_data.get("ingredients", [])
    user_profile = {"skin_type": "unknown", "skin_tone": "unknown", "allergies": [], "skin_concerns": []}

    safety_data = await llm_service.check_product_safety(
        product_name=structured_data.get("product_name", "Unknown"),
        product_ingredients=[str(i) for i in ingredients],
        user_profile=user_profile,
    )

    # ✅ Save to DB
    new_product = VanityProduct(
        user_id=current_user.id,
        brand=structured_data.get("brand", ""),
        product_name=structured_data.get("product_name", ""),
        category="OTHER",
        shade=structured_data.get("shade", ""),
        price=structured_data.get("price") or 0.0,
        ingredients=ingredients,
        is_safe_for_user=safety_data.get("is_safe", True),
        safety_warnings=safety_data.get("warnings", []),
        notes=structured_data.get("description", ""),
        product_image_url=image_url,
        created_at=datetime.utcnow(),
    )

    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)

    logger.info(f"💾 Product saved with ID {new_product.id}")

    # ✅ Async-safe search indexing (await it!)
    if hasattr(search_service, "upload_products"):
        await search_service.upload_products([{
            "id": str(new_product.id),
            "brand": new_product.brand,
            "product_name": new_product.product_name,
            "category": new_product.category,
            "shade": new_product.shade,
            "price": new_product.price,
            "ingredients": ingredients,
            "tags": structured_data.get("tags", []),
            "average_rating": 4.5,
            "total_reviews": 0,
            "in_stock": True,
            "image_url": new_product.product_image_url,
        }])

    return {
        "success": True,
        "product_id": new_product.id,
        "safety": safety_data,
        "structured_data": structured_data,
        "image_url": image_url,
    }


# ======================================================
# 🔍 3️⃣ Smart Product Lookup
# ======================================================
@router.get("/db-test")
async def test_db(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT 1"))
    return {"db_ok": result.scalar() == 1}

@router.get("/products/smart-find", response_model=VanityListResponse)
async def smart_find_products(
    query: str = Query(..., description="e.g. 'best matte foundation for oily skin under 1000'"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Search user's products or global database with AI parsing.
    Integrates with Azure AI Search.
    """
    await db.refresh(current_user, ["profile"]) 

    user_profile = {
        "skin_tone": current_user.profile.skin_tone,
        "undertone": current_user.profile.undertone,
        "skin_type": current_user.profile.skin_type,
        "skin_concerns": current_user.profile.skin_concerns,
        "allergies": current_user.profile.allergies,
    }

    results = await search_service.search_products(
        query=query,
        user_profile=user_profile,
        top=10
        
    )

    return VanityListResponse(products=results, total=len(results), skip=0, limit=10)

@router.get("/products", response_model=VanityListResponse)
async def get_all_products(
    category: Optional[ProductCategory] = None,
    is_favorite: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all products in user's vanity with optional filters
    """
    # Build query
    query = select(VanityProduct).where(
        VanityProduct.user_id == current_user.id,
        VanityProduct.is_active == True
    )
    
    if category:
        query = query.where(VanityProduct.category == category)
    
    if is_favorite is not None:
        query = query.where(VanityProduct.is_favorite == is_favorite)
    
    # Get total count
    count_result = await db.execute(query)
    total = len(count_result.scalars().all())
    
    # Apply pagination
    query = query.offset(skip).limit(limit).order_by(VanityProduct.created_at.desc())
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    return VanityListResponse(
        products=products,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/products/{product_id}", response_model=VanityProductResponse)
async def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get specific product details
    """
    result = await db.execute(
        select(VanityProduct).where(
            VanityProduct.id == product_id,
            VanityProduct.user_id == current_user.id
        )
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return product


@router.put("/products/{product_id}", response_model=VanityProductResponse)
async def update_product(
    product_id: int,
    product_update: VanityProductUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update product information
    """
    result = await db.execute(
        select(VanityProduct).where(
            VanityProduct.id == product_id,
            VanityProduct.user_id == current_user.id
        )
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Update fields
    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    # Re-check safety if ingredients changed
    if product_update.ingredients:
        await db.refresh(current_user, ["profile"])
        profile = current_user.profile
        
        safety_check = await llm_service.check_product_safety(
            product_update.ingredients,
            profile.allergies or [],
            [c.get("type", "") for c in profile.skin_concerns] if profile.skin_concerns else []
        )
        
        product.is_safe_for_user = safety_check["is_safe"]
        product.safety_warnings = safety_check["warnings"]
    
    await db.commit()
    await db.refresh(product)
    
    return product


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete (soft delete) a product from vanity
    """
    result = await db.execute(
        select(VanityProduct).where(
            VanityProduct.id == product_id,
            VanityProduct.user_id == current_user.id
        )
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Soft delete
    product.is_active = False
    
    # Update profile count
    await db.refresh(current_user, ["profile"])
    current_user.profile.products_count = max(0, current_user.profile.products_count - 1)
    
    await db.commit()
    
    return {"message": "Product removed from vanity"}


@router.post("/products/{product_id}/mark-used")
async def mark_product_used(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark product as used (increment usage count)
    """
    result = await db.execute(
        select(VanityProduct).where(
            VanityProduct.id == product_id,
            VanityProduct.user_id == current_user.id
        )
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    product.times_used += 1
    product.last_used = datetime.utcnow()
    
    await db.commit()
    
    return {
        "message": "Product usage recorded",
        "times_used": product.times_used
    }


@router.post("/products/{product_id}/toggle-favorite")
async def toggle_favorite(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Toggle product favorite status
    """
    result = await db.execute(
        select(VanityProduct).where(
            VanityProduct.id == product_id,
            VanityProduct.user_id == current_user.id
        )
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    product.is_favorite = not product.is_favorite
    
    await db.commit()
    
    return {
        "message": "Favorite status updated",
        "is_favorite": product.is_favorite
    }


@router.get("/products/category/{category}", response_model=List[VanityProductResponse])
async def get_products_by_category(
    category: ProductCategory,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all products in a specific category
    """
    result = await db.execute(
        select(VanityProduct).where(
            VanityProduct.user_id == current_user.id,
            VanityProduct.category == category,
            VanityProduct.is_active == True
        ).order_by(VanityProduct.is_favorite.desc(), VanityProduct.times_used.desc())
    )
    products = result.scalars().all()
    
    return products


@router.get("/stats")
async def get_vanity_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get vanity statistics
    """
    result = await db.execute(
        select(VanityProduct).where(
            VanityProduct.user_id == current_user.id,
            VanityProduct.is_active == True
        )
    )
    products = result.scalars().all()
    
    # Calculate stats
    total_products = len(products)
    total_value = sum(p.price or 0 for p in products)
    favorites = sum(1 for p in products if p.is_favorite)
    by_category = {}
    
    for product in products:
        cat = product.category.value
        by_category[cat] = by_category.get(cat, 0) + 1
    
    # Check expiring soon (within 30 days)
    from datetime import timedelta
    expiring_soon = [
        p for p in products 
        if p.expiry_date and p.expiry_date <= datetime.utcnow() + timedelta(days=30)
    ]
    
    return {
        "total_products": total_products,
        "total_value": total_value,
        "favorites_count": favorites,
        "by_category": by_category,
        "expiring_soon": len(expiring_soon),
        "most_used": max(products, key=lambda p: p.times_used).product_name if products else None
    }


@router.post("/check-safety", response_model=ProductSafetyCheck)
async def check_product_safety(
    ingredients: List[str],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Check if product ingredients are safe for user
    """
    await db.refresh(current_user, ["profile"])
    profile = current_user.profile
    
    safety_result = await llm_service.check_product_safety(
        ingredients,
        profile.allergies or [],
        [c.get("type", "") for c in profile.skin_concerns] if profile.skin_concerns else []
    )
    
    return ProductSafetyCheck(**safety_result)