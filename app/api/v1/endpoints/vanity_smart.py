"""
GlamAI - Smart Vanity Product Finder API
Powered by Azure AI Search + LLM personalization
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.services.azure.search_service import search_service
from app.services.azure.llm_service import llm_service
from app.models.user import User
from app.db.database import get_db
from app.api.dependencies.auth import get_current_user
from typing import Dict, Any, Optional
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/smart-vanity", tags=["Vanity | Smart Finder"])


# ======================================================
# 🧠 1️⃣ Smart AI Product Finder
# ======================================================
@router.get("/find")
async def smart_find_products(
    query: str = Query(..., description="Natural language query, e.g. 'best foundation for oily skin under 1000'"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    🔍 Smart Product Finder
    - Accepts natural language query (like a chatbot)
    - Extracts product category, filters, and preferences
    - Uses Azure Search + AI safety enrichment
    """
    try:
        # 🧠 Step 1: Parse user query into structured filters using LLM
        logger.info(f"🪄 Parsing smart vanity query: {query}")

        llm_prompt = f"""
You are an intelligent beauty product recommender.
Analyze this query and extract structured filters for product search.

Query: "{query}"

Return a JSON object like:
{{
  "category": "foundation|lipstick|blush|eyeliner|other",
  "max_price": number or null,
  "skin_type": "oily|dry|combination|sensitive|normal" or null,
  "undertone": "warm|cool|neutral" or null,
  "skin_tone": "fair|medium|tan|deep" or null,
  "special_tags": ["matte", "longwear", "waterproof"]
}}
"""

        parsed = await llm_service.get_structured_response(
            prompt=llm_prompt,
            system_role="beauty_expert",
            max_tokens=500
        )

        filters = parsed or {}
        category = filters.get("category") or "foundation"
        max_price = filters.get("max_price")
        tags = filters.get("special_tags", [])
        user_profile = {
            "skin_tone": filters.get("skin_tone") or current_user.profile.skin_tone,
            "undertone": filters.get("undertone") or current_user.profile.undertone,
            "skin_type": filters.get("skin_type") or current_user.profile.skin_type,
            "allergies": current_user.profile.allergies,
            "skin_concerns": current_user.profile.skin_concerns,
        }

        logger.info(f"✨ Parsed filters for search: {filters}")

        # 🧩 Step 2: Perform Azure AI Search (Hybrid)
        results = await search_service.search_products(
            category=category,
            user_profile=user_profile,
            avoid_concerns=user_profile["skin_concerns"],
            avoid_allergens=user_profile["allergies"],
            max_price=max_price,
            query=query,
            top=10
        )

        if not results:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="No matching products found.")

        # 🧠 Step 3: Optionally summarize results for chat or voice response
        summary_prompt = f"""
Summarize these products in 2-3 short lines for a user with {user_profile['skin_type']} skin.
Data: {results[:3]}
"""
        summary = await llm_service.get_text_completion(summary_prompt)

        logger.info(f"💄 Smart vanity results ready ({len(results)} products).")
        return {
            "status": "success",
            "query": query,
            "parsed_filters": filters,
            "total": len(results),
            "summary": summary,
            "results": results
        }

    except Exception as e:
        logger.error(f"❌ Smart product finder error: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process smart product query.")


# ======================================================
# 🛍️ 2️⃣ Smart Substitutes (Budget or Allergy Friendly)
# ======================================================
@router.get("/substitutes/{product_id}")
async def find_product_substitutes(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    💰 Find substitute or safer alternatives for a product.
    - Checks price, safety, and user profile match.
    """
    try:
        result = await db.execute(f"SELECT * FROM vanity_products WHERE id = {product_id}")
        product = result.fetchone()
        if not product:
            raise HTTPException(404, detail="Product not found")

        user_profile = {
            "skin_tone": current_user.profile.skin_tone,
            "undertone": current_user.profile.undertone,
            "skin_type": current_user.profile.skin_type,
            "allergies": current_user.profile.allergies,
            "skin_concerns": current_user.profile.skin_concerns,
        }

        substitutes = await search_service.find_product_substitutes(
            original_category=product.category,
            user_profile=user_profile,
            max_price=product.price or None
        )

        return {
            "status": "success",
            "original_product": product.product_name,
            "suggestions": substitutes
        }

    except Exception as e:
        logger.error(f"❌ Substitute search failed: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not fetch substitutes.")
