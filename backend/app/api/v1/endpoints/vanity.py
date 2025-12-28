"""
GlamAI - Vanity (Product Inventory) Endpoints
Smart Makeup Product Management with AI Enrichment
Enhanced with Barcode Detection & Lookup
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.user import User, UserProfile
from app.models.vanity import VanityProduct, ProductCategory
from app.schemas.vanity import (
    VanityProductCreate, VanityProductUpdate, VanityProductResponse,
    VanityListResponse, ProductSafetyCheck
)
from bs4  import BeautifulSoup
from app.core.config import settings
from app.api.deps.auth import db_refresh, get_current_user
from azure.ai.formrecognizer.aio import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from app.services.azure.llm_service import llm_service
from app.services.azure.search_service import search_service
from app.services.azure.storage_service import storage_service

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from loguru import logger
import io
import json
import re
import httpx  # For barcode API lookups

router = APIRouter(tags=["Vanity | Products"])

# ======================================================
# 🔢 BARCODE SERVICE - MUST BE BEFORE ENDPOINTS
# ======================================================

class BarcodeProductService:
    """Service to detect barcodes and fetch product info"""
    
    def detect_barcode(self, text: str) -> Optional[str]:
        """Detect barcode in text"""
        # Remove whitespace
        text = text.replace(" ", "").replace("\n", "").replace("\r", "")
        
        # Barcode patterns
        barcode_patterns = [
            r'\b\d{13}\b',  # EAN-13 (most common)
            r'\b\d{12}\b',  # UPC-A
            r'\b\d{14}\b',  # GTIN-14
            r'\b\d{8}\b',   # EAN-8
        ]
        
        for pattern in barcode_patterns:
            match = re.search(pattern, text)
            if match:
                barcode = match.group(0)
                logger.info(f"🔢 Detected barcode: {barcode}")
                return barcode
        
        return None
    
    async def lookup_barcode(self, barcode: str) -> Optional[Dict[str, Any]]:
        """Lookup product using barcode APIs"""
        logger.info(f"🔍 Looking up barcode: {barcode}")
        
        # Try UPCitemdb
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                url = f"https://api.upcitemdb.com/prod/trial/lookup?upc={barcode}"
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data.get("items") and len(data["items"]) > 0:
                        item = data["items"][0]
                        
                        result = {
                            "source": "upcitemdb",
                            "brand": item.get("brand", ""),
                            "product_name": item.get("title", ""),
                            "description": item.get("description", ""),
                            "category": item.get("category", ""),
                            "images": item.get("images", []),
                            "barcode": barcode
                        }
                        
                        logger.info(f"✅ Found on UPCitemdb: {result['product_name']}")
                        return result
        except Exception as e:
            logger.warning(f"⚠️ UPCitemdb failed: {e}")
        
        # Try OpenFoodFacts
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data.get("status") == 1 and data.get("product"):
                        product = data["product"]
                        
                        result = {
                            "source": "openfoodfacts",
                            "brand": product.get("brands", ""),
                            "product_name": product.get("product_name", ""),
                            "description": product.get("generic_name", ""),
                            "category": product.get("categories", ""),
                            "ingredients": product.get("ingredients_text", ""),
                            "images": [product.get("image_url", "")],
                            "barcode": barcode
                        }
                        
                        logger.info(f"✅ Found on OpenFoodFacts: {result['product_name']}")
                        return result
        except Exception as e:
            logger.warning(f"⚠️ OpenFoodFacts failed: {e}")
        
        logger.warning(f"❌ No API results for barcode {barcode}")
        return None
    
    async def search_barcode_with_llm(self, barcode: str, llm_service_instance) -> Optional[Dict[str, Any]]:
        """Use LLM to search for product by barcode"""
        logger.info(f"🤖 LLM searching barcode: {barcode}")
        
        try:
            prompt = f"""
Search for a cosmetic/beauty product with barcode/UPC/EAN: {barcode}

This barcode is typically used for makeup products like foundation, lipstick, concealer, etc.

Find and extract the following information:
1. Brand name (e.g., Maybelline, MAC, L'Oreal, Revlon, NYX)
2. Full product name
3. Product category (foundation, lipstick, eyeshadow, mascara, blush, primer, concealer, eyeliner, skincare, or other)
4. Shade or color if mentioned
5. Key ingredients if available
6. Brief description

Return ONLY valid JSON (no markdown, no code blocks):
{{
    "brand": "brand name or empty string",
    "product_name": "full product name or empty string",
    "category": "foundation|lipstick|eyeshadow|mascara|blush|primer|concealer|eyeliner|skincare|other",
    "shade": "shade/color or empty string",
    "ingredients": ["ingredient1", "ingredient2"],
    "description": "brief description or empty string",
    "price": 0.0,
    "tags": ["tag1", "tag2"]
}}

IMPORTANT: 
- If you cannot find the product, return empty strings for brand and product_name
- Do NOT make up information
- Only return information from reliable sources
"""
            
            response = await llm_service_instance.get_structured_response(
                prompt=prompt,
                system_role="product research specialist",
                max_tokens=1000
            )
            
            # Check if we got meaningful results
            if response and response.get("product_name") and len(response.get("product_name", "")) > 3:
                logger.info(f"✅ LLM found: {response.get('brand', 'Unknown')} {response['product_name']}")
                return {
                    "source": "llm_search",
                    "barcode": barcode,
                    **response
                }
            else:
                logger.warning(f"⚠️ LLM couldn't find product")
                return None
            
        except Exception as e:
            logger.error(f"❌ LLM search failed: {e}")
            return None


# CREATE SINGLETON INSTANCE HERE (after class definition)
barcode_service = BarcodeProductService()


# ======================================================
# 📸 PRODUCT SCAN ENDPOINT
# ======================================================

@router.post("/products/scan")
async def scan_product(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    💄 Enhanced Product Scanner with Barcode Lookup
    """
    
    try:
        # 1️⃣ Upload Image
        logger.info(f"📸 Scanning for user {current_user.id}")
        
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        image_url = await storage_service._upload_image(
            image_bytes=image_bytes,
            container_name="results",
            prefix=f"user_{current_user.id}_product",
            content_type=file.content_type or "image/jpeg"
        )
        logger.info(f"✅ Uploaded: {image_url}")

        # 2️⃣ Run OCR
        logger.info("🔍 Running OCR...")
        
        client = DocumentAnalysisClient(
            endpoint=settings.AZURE_FORM_RECOGNIZER_ENDPOINT,
            credential=AzureKeyCredential(settings.AZURE_FORM_RECOGNIZER_KEY)
        )
        
        extracted_text = ""
        
        async with client:
            poller = await client.begin_analyze_document(
                model_id="prebuilt-read",
                document=io.BytesIO(image_bytes)
            )
            result = await poller.result()
            
            if result.pages:
                for page in result.pages:
                    for line in page.lines:
                        extracted_text += line.content + " "
                extracted_text = extracted_text.strip()
        
        logger.info(f"📜 OCR: {len(extracted_text)} chars - '{extracted_text[:100]}'")

        # 3️⃣ Detect & Lookup Barcode
        barcode = barcode_service.detect_barcode(extracted_text)
        structured_data = None
        lookup_method = None
        
        if barcode:
            logger.info(f"🔢 Barcode detected: {barcode}")
            
            # Try API lookup
            barcode_data = await barcode_service.lookup_barcode(barcode)
            
            if barcode_data:
                lookup_method = barcode_data.get("source")
                
                # Parse ingredients
                ingredients_text = barcode_data.get("ingredients", "")
                if isinstance(ingredients_text, str) and ingredients_text:
                    try:
                        ing_prompt = f"""
Extract ingredient list from: {ingredients_text[:500]}
Return JSON: {{"ingredients": ["ingredient1", "ingredient2"]}}
"""
                        ing_result = await llm_service.get_structured_response(
                            prompt=ing_prompt,
                            system_role="ingredient parser",
                            max_tokens=500
                        )
                        ingredients_list = ing_result.get("ingredients", [])
                    except Exception as ing_error:
                        logger.warning(f"⚠️ Ingredient parsing failed: {ing_error}")
                        ingredients_list = []
                else:
                    ingredients_list = barcode_data.get("ingredients", [])
                
                structured_data = {
                    "brand": barcode_data.get("brand", ""),
                    "product_name": barcode_data.get("product_name", ""),
                    "shade": "",
                    "category": "other",  # Default to other for API results
                    "description": barcode_data.get("description", ""),
                    "tags": [],
                    "price": 0.0,
                    "ingredients": ingredients_list
                }
                
                logger.info(f"✅ Found via {lookup_method}")
            
            else:
                # Fallback: LLM search
                logger.info("🤖 API failed, trying LLM search...")
                llm_result = await barcode_service.search_barcode_with_llm(barcode, llm_service)
                
                if llm_result:
                    structured_data = llm_result
                    lookup_method = "llm_search"
                    logger.info("✅ Found via LLM search")
        
        # 4️⃣ Fallback: LLM Parsing
        if not structured_data:
            logger.info("🧠 No barcode or lookup failed, using LLM parsing...")
            
            if len(extracted_text) < 15:
                structured_data = {
                    "brand": "",
                    "product_name": "Unknown Product",
                    "shade": "",
                    "category": "other",
                    "description": "Could not extract info",
                    "tags": [],
                    "price": 0.0,
                    "ingredients": []
                }
                lookup_method = "failed_ocr"
            else:
                prompt = f"""
Extract cosmetic product info from text.
Return ONLY valid JSON:

{{
    "brand": "",
    "product_name": "",
    "shade": "",
    "category": "foundation|lipstick|eyeshadow|mascara|blush|primer|concealer|eyeliner|skincare|other",
    "description": "",
    "tags": [],
    "price": 0.0,
    "ingredients": []
}}

Text: {extracted_text[:2000]}
"""
                
                try:
                    llm_resp = await llm_service.client.chat.completions.create(
                        model=llm_service.model,
                        messages=[
                            {"role": "system", "content": "You are a beauty product parser."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.3,
                        max_tokens=1000,
                        response_format={"type": "json_object"}
                    )
                    
                    structured_data = json.loads(llm_resp.choices[0].message.content)
                    lookup_method = "llm_parsing"
                except Exception as parse_error:
                    logger.error(f"❌ LLM parsing failed: {parse_error}")
                    structured_data = {
                        "brand": "",
                        "product_name": "Unknown Product",
                        "shade": "",
                        "category": "other",
                        "description": extracted_text[:200],
                        "tags": [],
                        "price": 0.0,
                        "ingredients": []
                    }
                    lookup_method = "failed_llm"

        # 5️⃣ Normalize Ingredients
        ingredients = structured_data.get("ingredients", [])
        if ingredients and isinstance(ingredients[0], dict):
            ingredients = [
                item.get("name", "") or item.get("ingredient", "") 
                for item in ingredients if isinstance(item, dict)
            ]
        ingredients = [str(i).strip() for i in ingredients if i]

        # 6️⃣ Get User Profile
        await db.refresh(current_user, ["profile"])
        user_profile = current_user.profile

        if user_profile:
            allergies = user_profile.allergies or []
            if isinstance(allergies, str):
                allergies = [allergies]
            
            skin_concerns = user_profile.skin_concerns or []
            if skin_concerns and isinstance(skin_concerns[0], dict):
                skin_concerns = [c.get("type", "") for c in skin_concerns if isinstance(c, dict)]
            
            user_profile_dict = {
                "allergies": [str(a).strip() for a in allergies if a],
                "skin_concerns": [str(c).strip() for c in skin_concerns if c],
                "skin_type": user_profile.skin_type or "unknown",
                "skin_tone": user_profile.skin_tone or "unknown",
            }
        else:
            user_profile_dict = {
                "allergies": [],
                "skin_concerns": [],
                "skin_type": "unknown",
                "skin_tone": "unknown",
            }

        # 7️⃣ Safety Check
        try:
            safety_data = await llm_service.check_product_safety(
                product_name=structured_data.get("product_name", "Unknown"),
                product_ingredients=ingredients,
                user_profile=user_profile_dict
            )
        except Exception as e:
            logger.error(f"⚠️ Safety check failed: {e}")
            safety_data = {
                "is_safe": True,
                "safety_score": 0.8,
                "warnings": ["Safety check unavailable"],
                "allergens_found": [],
                "concern_conflicts": [],
                "severity": "unknown",
                "recommendation": "review_manually",
                "confidence": 0.5
            }

        # 8️⃣ Map Category to Enum SAFELY
        category_str = structured_data.get("category", "other")
        
        # Ensure it's a string
        if not isinstance(category_str, str):
            category_str = "other"
        
        category_str = category_str.lower().strip()
        
        # Category mapping to handle variations
        category_mapping = {
            "foundation": "foundation",
            "base": "foundation",
            "face makeup": "foundation",
            "lipstick": "lipstick",
            "lip color": "lipstick",
            "lip": "lipstick",
            "eyeshadow": "eyeshadow",
            "eye shadow": "eyeshadow",
            "eyes": "eyeshadow",
            "mascara": "mascara",
            "blush": "blush",
            "rouge": "blush",
            "cheek": "blush",
            "primer": "primer",
            "concealer": "concealer",
            "eyeliner": "eyeliner",
            "eye liner": "eyeliner",
            "skincare": "skincare",
            "skin care": "skincare",
            "other": "other",
        }
        
        mapped_category = category_mapping.get(category_str, "other")
        
        # Convert to enum with error handling
        try:
            category_value = ProductCategory(mapped_category)
            logger.info(f"✅ Category: '{category_str}' → {mapped_category}")
        except (ValueError, AttributeError) as cat_error:
            logger.warning(f"⚠️ Category error: {cat_error}, using 'other'")
            try:
                category_value = ProductCategory.other
            except AttributeError:
                # If even 'other' doesn't exist, use string
                category_value = "other"

        # 9️⃣ Save to Database
        try:
            new_product = VanityProduct(
                user_id=current_user.id,
                brand=structured_data.get("brand", "")[:100],
                product_name=structured_data.get("product_name", "Unknown")[:200],
                category=category_value,
                shade=structured_data.get("shade", "")[:100],
                price=float(structured_data.get("price") or 0.0),
                ingredients=ingredients,
                is_safe_for_user=safety_data.get("is_safe", True),
                safety_warnings=safety_data.get("warnings", []),
                notes=structured_data.get("description", "")[:500],
                tags=structured_data.get("tags", []),
                product_image_url=image_url,
                created_at=datetime.utcnow(),
            )
            
            db.add(new_product)
            
            if user_profile:
                user_profile.products_count = (user_profile.products_count or 0) + 1
            
            await db.commit()
            await db.refresh(new_product)
            
            logger.info(f"✅ Saved product ID {new_product.id}")
            
        except Exception as db_error:
            logger.error(f"❌ Database save failed: {db_error}")
            await db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to save product: {str(db_error)}")

        # 🔟 Index to Azure Search
        try:
            # Get category value safely for Azure Search
            if hasattr(category_value, 'value'):
                category_for_search = category_value.value
            elif isinstance(category_value, str):
                category_for_search = category_value
            else:
                category_for_search = str(category_value)
            
            await search_service.upload_products([{
                "id": str(new_product.id),
                "brand": new_product.brand or "",
                "product_name": new_product.product_name or "Unknown",
                "category": category_for_search,
                "shade": new_product.shade or "",
                "price": float(new_product.price or 0.0),
                "ingredients": ingredients,
                "tags": new_product.tags or [],
                "average_rating": 4.5,
                "total_reviews": 0,
                "in_stock": True,
                "image_url": new_product.product_image_url or "",
                "product_url": "",
            }])
            logger.info("✅ Indexed in Azure Search")
        except Exception as e:
            logger.warning(f"⚠️ Azure Search failed: {e}")

        # 1️⃣1️⃣ Return Success
        return {
            "success": True,
            "product_id": new_product.id,
            "product_name": new_product.product_name,
            "brand": new_product.brand,
            "category": category_for_search,
            "shade": new_product.shade,
            "image_url": new_product.product_image_url,
            "lookup_info": {
                "barcode_detected": barcode,
                "lookup_method": lookup_method,
                "ocr_text_length": len(extracted_text),
                "ocr_preview": extracted_text[:100]
            },
            "safety": {
                "is_safe": safety_data.get("is_safe", True),
                "safety_score": safety_data.get("safety_score", 0.8),
                "warnings": safety_data.get("warnings", []),
                "recommendation": safety_data.get("recommendation", "safe_to_use"),
                "severity": safety_data.get("severity", "low"),
            },
            "ingredients_count": len(ingredients),
            "ingredients_preview": ingredients[:5] if ingredients else [],
            "tags": new_product.tags or [],
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Scan failed: {str(e)}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


# ======================================================
# 🧪 OCR DIAGNOSTIC ENDPOINT
# ======================================================

@router.post("/products/test-ocr")
async def test_ocr(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """🔍 OCR Diagnostic Tool - Test text extraction without saving"""
    try:
        logger.info(f"🧪 Testing OCR for user {current_user.id}")
        
        image_bytes = await file.read()
        logger.info(f"📦 Image: {len(image_bytes)} bytes, type: {file.content_type}")
        
        client = DocumentAnalysisClient(
            endpoint=settings.AZURE_FORM_RECOGNIZER_ENDPOINT,
            credential=AzureKeyCredential(settings.AZURE_FORM_RECOGNIZER_KEY)
        )
        
        results = {}
        
        async with client:
            # Test Model 1: prebuilt-read
            try:
                poller = await client.begin_analyze_document(
                    model_id="prebuilt-read",
                    document=io.BytesIO(image_bytes)
                )
                result = await poller.result()
                
                text_lines = []
                all_text = ""
                
                if result.pages:
                    for page_num, page in enumerate(result.pages, 1):
                        for line_num, line in enumerate(page.lines, 1):
                            text_lines.append({
                                "line_number": line_num,
                                "content": line.content,
                            })
                            all_text += line.content + " "
                
                results["prebuilt_read"] = {
                    "success": True,
                    "total_characters": len(all_text.strip()),
                    "lines": text_lines,
                    "full_text": all_text.strip()
                }
            except Exception as e:
                results["prebuilt_read"] = {"success": False, "error": str(e)}
            
            # Test Model 2: prebuilt-document
            try:
                poller = await client.begin_analyze_document(
                    model_id="prebuilt-document",
                    document=io.BytesIO(image_bytes)
                )
                result = await poller.result()
                
                results["prebuilt_document"] = {
                    "success": True,
                    "total_characters": len(result.content or ""),
                    "full_text": result.content or ""
                }
            except Exception as e:
                results["prebuilt_document"] = {"success": False, "error": str(e)}
        
        # Find best model
        best_model = None
        max_chars = 0
        
        for model_name, model_result in results.items():
            if model_result.get("success") and model_result.get("total_characters", 0) > max_chars:
                max_chars = model_result["total_characters"]
                best_model = model_name
        
        return {
            "success": True,
            "image_info": {
                "size_bytes": len(image_bytes),
                "content_type": file.content_type,
                "filename": file.filename
            },
            "ocr_results": results,
            "summary": {
                "best_model": best_model,
                "max_characters_extracted": max_chars,
                "is_image_readable": max_chars > 50
            }
        }
    
    except Exception as e:
        logger.error(f"❌ OCR test failed: {e}", exc_info=True)
        return {"success": False, "error": str(e)}



# ======================================================
# 🧠 SMART ADD PRODUCT
# ======================================================

@router.post("/products", response_model=VanityProductResponse, status_code=status.HTTP_201_CREATED)
async def add_product(
    product_data: VanityProductCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add product with AI enrichment"""
    
    await db.refresh(current_user, ["profile"])
    profile = current_user.profile

    # AI enrichment
    if not product_data.category or not product_data.shade:
        enrichment_prompt = f"""
Extract product info for:
Brand: {product_data.brand or "Unknown"}
Product: {product_data.product_name}
Shade: {product_data.shade or "N/A"}

Return JSON:
{{"category": "foundation|lipstick|primer|other", "shade": "color", "tags": []}}
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

    # Safety check
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

    db.add(new_product)
    current_user.profile.products_count += 1

    await db.commit()
    await db.refresh(new_product)

    logger.info(f"✨ Product added: {new_product.product_name}")
    return new_product


# ======================================================
# 🔍 OTHER ENDPOINTS (GET, UPDATE, DELETE, etc.)
# ======================================================

@router.get("/products", response_model=VanityListResponse)
async def get_all_products(
    category: Optional[ProductCategory] = None,
    is_favorite: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all user products with filters"""
    query = select(VanityProduct).where(
        VanityProduct.user_id == current_user.id,
        VanityProduct.is_active == True
    )
    
    if category:
        query = query.where(VanityProduct.category == category)
    
    if is_favorite is not None:
        query = query.where(VanityProduct.is_favorite == is_favorite)
    
    count_result = await db.execute(query)
    total = len(count_result.scalars().all())
    
    query = query.offset(skip).limit(limit).order_by(VanityProduct.created_at.desc())
    result = await db.execute(query)
    products = result.scalars().all()
    
    return VanityListResponse(products=products, total=total, skip=skip, limit=limit)


@router.get("/products/{product_id}", response_model=VanityProductResponse)
async def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get specific product"""
    result = await db.execute(
        select(VanityProduct).where(
            VanityProduct.id == product_id,
            VanityProduct.user_id == current_user.id
        )
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    
    return product


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete product"""
    result = await db.execute(
        select(VanityProduct).where(
            VanityProduct.id == product_id,
            VanityProduct.user_id == current_user.id
        )
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    
    product.is_active = False
    
    await db.refresh(current_user, ["profile"])
    current_user.profile.products_count = max(0, current_user.profile.products_count - 1)
    
    await db.commit()
    
    return {"message": "Product removed"}


@router.get("/stats")
async def get_vanity_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get vanity statistics"""
    result = await db.execute(
        select(VanityProduct).where(
            VanityProduct.user_id == current_user.id,
            VanityProduct.is_active == True
        )
    )
    products = result.scalars().all()
    
    total_products = len(products)
    total_value = sum(p.price or 0 for p in products)
    favorites = sum(1 for p in products if p.is_favorite)
    by_category = {}
    
    for product in products:
        cat = product.category.value
        by_category[cat] = by_category.get(cat, 0) + 1
    
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