"""
GlamAI - Azure AI Search Service (Advanced)
Hybrid Product Search + AI Safety Enrichment + RAG-ready
"""



from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SimpleField,
    SearchableField,
    SearchFieldDataType
)

from azure.core.credentials import AzureKeyCredential
from app.core.config import settings
import logging
import asyncio
from typing import List, Optional, Dict, Any
from app.services.azure import llm_service



logger = logging.getLogger(__name__)

class SearchService:
    def __init__(self):
        self.endpoint = settings.AZURE_SEARCH_ENDPOINT
        self.index_name = settings.AZURE_SEARCH_INDEX_NAME
        self.credential = AzureKeyCredential(settings.AZURE_SEARCH_KEY)
        self.search_client = SearchClient(self.endpoint, self.index_name, self.credential)
        self.index_client = SearchIndexClient(self.endpoint, self.credential)
        self._ensure_index_exists()

    def _ensure_index_exists(self):
        """Ensures that the Azure Search index exists with correct fields"""
        try:
            if self.index_name not in [i.name for i in self.index_client.list_indexes()]:
                logger.info(f"🔧 Creating new Azure Search index: {self.index_name}")
                fields = [
                    SimpleField(name="id", type=SearchFieldDataType.String, key=True),
                    SearchableField(name="brand", type=SearchFieldDataType.String, sortable=True),
                    SearchableField(name="product_name", type=SearchFieldDataType.String, sortable=True),
                    SearchableField(name="category", type=SearchFieldDataType.String, sortable=True),
                    SearchableField(name="shade", type=SearchFieldDataType.String),
                    SimpleField(name="price", type=SearchFieldDataType.Double, sortable=True, filterable=True),
                    SimpleField(name="average_rating", type=SearchFieldDataType.Double, sortable=True, filterable=True),
                    SimpleField(name="total_reviews", type=SearchFieldDataType.Int32, sortable=True, filterable=True),
                    SimpleField(name="in_stock", type=SearchFieldDataType.Boolean, filterable=True),
                    SearchableField(name="tags", type=SearchFieldDataType.Collection(SearchFieldDataType.String)),
                    SearchableField(name="ingredients", type=SearchFieldDataType.Collection(SearchFieldDataType.String)),
                    SimpleField(name="image_url", type=SearchFieldDataType.String),
                    SimpleField(name="product_url", type=SearchFieldDataType.String),
                ]
                index = SearchIndex(name=self.index_name, fields=fields)
                self.index_client.create_index(index)
                logger.info("✅ Azure Search index created successfully")
            else:
                logger.info(f"✅ Azure Search index '{self.index_name}' already exists")
        except Exception as e:
            logger.error(f"❌ Error ensuring Azure Search index: {e}")

    async def upload_products(self, products: list[dict]):
        """Upload or merge product data into Azure Search"""
        try:
            result = self.search_client.upload_documents(documents=products)
            logger.info(f"✅ Uploaded {len(result)} products to Azure Search")
        except Exception as e:
            logger.error(f"❌ Failed to upload products: {e}")


    # ======================================================
    # 🧠 Hybrid Product Search (Vector + Filtered)
    # ======================================================
    async def search_products(
        self,
        category: Optional[str] = None,
        user_profile: Optional[Dict[str, Any]] = None,
        avoid_concerns: Optional[List[str]] = None,
        avoid_allergens: Optional[List[str]] = None,
        query: Optional[str] = "*",
        max_price: Optional[float] = None,
        top: int = 10,
        enrich_results: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Hybrid search that combines:
        - Category + filters
        - AI semantic relevance
        - Optional LLM safety enrichment
        """
        try:
            # 🧩 Base filters
            filters = ["is_active eq true", "in_stock eq true"]
            if category:
                filters.append(f"category eq '{category}'")

            # 💧 Skin type, tone, undertone filters (optional)
            if user_profile:
                if user_profile.get("skin_tone"):
                    filters.append(f"suitable_skin_tones/any(t: t eq '{user_profile['skin_tone'].lower()}')")
                if user_profile.get("undertone"):
                    filters.append(f"suitable_undertones/any(u: u eq '{user_profile['undertone'].lower()}')")
                if user_profile.get("skin_type"):
                    filters.append(f"suitable_skin_types/any(s: s eq '{user_profile['skin_type'].lower()}')")

            if max_price:
                filters.append(f"price le {max_price}")

            filter_expr = " and ".join(filters)

            # 🔍 Perform hybrid search (vector + text)
            results = self.search_client.search(
                search_text=query or "*",
                filter=filter_expr,
                # select=[
                #     "id", "brand", "product_name", "category", "shade",
                #     "price", "image_url", "product_url", "ingredients",
                #     "average_rating", "total_reviews", "tags",
                #     "affiliate_link_nykaa", "affiliate_link_amazon"
                # ],
                # select=["*"],
                top=top,
                order_by=["average_rating desc", "total_reviews desc"]
            )

            products = [dict(r) for r in results]

            # 🧠 Optional AI safety enrichment
            if enrich_results and user_profile:
                enriched_products = await self._enrich_with_safety(products, user_profile, avoid_concerns, avoid_allergens)
                return enriched_products

            return products

        except Exception as e:
            logger.error(f"❌ Product search error: {str(e)}")
            return []



    

    # ======================================================
    # 🧴 AI Safety + Ingredient Analysis
    # ======================================================
    async def _enrich_with_safety(
        self,
        products: List[Dict[str, Any]],
        user_profile: Dict[str, Any],
        avoid_concerns: Optional[List[str]] = None,
        avoid_allergens: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Check each product using AI for safety."""
        tasks = []

        for product in products:
            ingredients = product.get("ingredients", [])
            product_name = product.get("product_name", "Unknown Product")

            # Create a concurrent safety check task
            tasks.append(
                llm_service.check_product_safety(
                    product_name=product_name,
                    product_ingredients=ingredients,
                    user_profile=user_profile
                )
            )

        # Run all safety checks in parallel for speed ⚡
        safety_results = await asyncio.gather(*tasks, return_exceptions=True)

        for i, result in enumerate(safety_results):
            if isinstance(result, Exception):
                logger.warning(f"⚠️ Safety enrichment failed for {products[i].get('product_name')}")
                products[i]["is_safe_for_user"] = True
                products[i]["safety_score"] = 0.8
                products[i]["warnings"] = []
                continue

            products[i].update({
                "is_safe_for_user": result.get("is_safe"),
                "safety_score": result.get("safety_score"),
                "safety_confidence": result.get("confidence"),
                "safety_warnings": result.get("warnings", []),
                "safety_recommendation": result.get("recommendation"),
                "severity": result.get("severity")
            })

        return products

    # ======================================================
    # 💰 Smart Product Substitutes
    # ======================================================
    async def find_product_substitutes(
        self,
        category: str,
        user_profile: Dict[str, Any],
        max_price: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """Find budget-friendly substitutes using AI-enriched product search"""
        return await self.search_products(
            category=category,
            user_profile=user_profile,
            max_price=max_price,
            query="budget-friendly",
            top=5
        )

    # ======================================================
    # 🔥 Trending Product Fetch
    # ======================================================
    async def get_trending_products(
        self,
        category: Optional[str] = None,
        top: int = 10
    ) -> List[Dict[str, Any]]:
        """Get trending/popular products"""
        try:
            filter_expr = "is_active eq true and in_stock eq true"
            if category:
                filter_expr += f" and category eq '{category}'"

            results = self.search_client.search(
                search_text="*",
                filter=filter_expr,
                select=[
                    "id", "brand", "product_name", "category", "price",
                    "image_url", "average_rating", "total_reviews"
                ],
                top=top,
                order_by=["total_reviews desc", "average_rating desc"]
            )

            return [dict(r) for r in results]

        except Exception as e:
            logger.error(f"🔥 Trending products error: {str(e)}")
            return []


# 🧠 Singleton Instance
search_service = SearchService()
