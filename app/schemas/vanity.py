"""
GlamAI - Vanity/Product Schemas
Pydantic models for smart, AI-enriched product inventory
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.vanity import ProductCategory


# ======================================================
# 🧩 Simplified user-side input model (AI-enriched later)
# ======================================================

class VanityProductCreate(BaseModel):
    """
    Simplified product input schema.
    User only provides minimal info — AI enriches the rest.
    """
    product_name: str = Field(..., min_length=1, max_length=500)
    brand: Optional[str] = Field(None, max_length=255)
    category: Optional[ProductCategory] = None
    shade: Optional[str] = Field(None, max_length=255)
    price: Optional[float] = Field(None, ge=0)
    ingredients: Optional[List[str]] = None
    # Optional for power users — backend will handle if missing
    purchase_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


# ======================================================
# 🔄 Update model (for manual edits or corrections)
# ======================================================

class VanityProductUpdate(BaseModel):
    brand: Optional[str] = None
    product_name: Optional[str] = None
    category: Optional[ProductCategory] = None
    shade: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    purchase_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    ingredients: Optional[List[str]] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    is_favorite: Optional[bool] = None
    rating: Optional[float] = Field(None, ge=0, le=5)
    times_used: Optional[int] = Field(None, ge=0)


# ======================================================
# 🧠 AI-enriched internal data model
# ======================================================

class EnrichedVanityProduct(BaseModel):
    """
    AI-enriched data structure (filled by LLM/RAG automatically)
    """
    description: Optional[str] = None
    ingredients: List[str] = []
    is_safe_for_user: Optional[bool] = True
    safety_warnings: List[str] = []
    skin_safety_rating: Optional[float] = Field(None, ge=0, le=1)
    allergy_conflicts: List[str] = []
    product_source: Optional[str] = Field("auto", description="manual | ai | rag | web")
    enrichment_confidence: Optional[float] = Field(0.9, ge=0, le=1)
    meta_data: Optional[Dict[str, Any]] = None


# ======================================================
# 💄 Response model (combined full view)
# ======================================================

class VanityProductResponse(BaseModel):
    """Full vanity product info (merged AI + user data)"""
    id: int
    user_id: int
    category: Optional[ProductCategory]
    brand: Optional[str]
    product_name: str
    shade: Optional[str]

    # Optional visuals
    product_image_url: Optional[str]
    barcode: Optional[str]

    # Dates & pricing
    purchase_date: Optional[datetime]
    expiry_date: Optional[datetime]
    price: Optional[float]

    # AI + Safety fields
    ingredients: List[str] = []
    is_safe_for_user: Optional[bool] = True
    safety_warnings: List[str] = []
    skin_safety_rating: Optional[float] = None
    allergy_conflicts: List[str] = []
    product_source: Optional[str] = "auto"

    # Usage & feedback
    times_used: int
    last_used: Optional[datetime]
    is_favorite: bool
    rating: Optional[float]

    # Notes & tags
    notes: Optional[str]
    tags: List[str] = []

    # Lifecycle
    is_active: bool
    is_finished: bool

    # Audit
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ======================================================
# 📦 List and search models
# ======================================================

class VanityListResponse(BaseModel):
    """List of vanity products with pagination"""
    products: List[VanityProductResponse]
    total: int
    skip: int
    limit: int


class ProductSafetyCheck(BaseModel):
    """Product safety check result"""
    is_safe: bool
    warnings: List[str] = []
    allergens_found: List[str] = []
    concern_conflicts: List[str] = []
    recommendation: str


class ProductDatabaseItem(BaseModel):
    """Product from global AI/enriched database"""
    id: int
    category: ProductCategory
    brand: str
    product_name: str
    shade: Optional[str]
    description: Optional[str]
    image_url: Optional[str]
    product_url: Optional[str]
    
    price: Optional[float]
    currency: str

    suitable_skin_tones: List[str] = []
    suitable_skin_types: List[str] = []
    suitable_undertones: List[str] = []

    avoids_concerns: List[str] = []
    allergen_free: List[str] = []

    average_rating: float
    total_reviews: int

    affiliate_link_nykaa: Optional[str]
    affiliate_link_amazon: Optional[str]
    tags: List[str] = []

    class Config:
        from_attributes = True


class ProductSearchRequest(BaseModel):
    """Product search request"""
    category: Optional[ProductCategory] = None
    skin_tone: Optional[str] = None
    undertone: Optional[str] = None
    skin_type: Optional[str] = None
    avoid_concerns: Optional[List[str]] = None
    avoid_allergens: Optional[List[str]] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = Field(None, ge=0, le=5)


class ProductSearchResponse(BaseModel):
    """Product search results"""
    products: List[ProductDatabaseItem]
    total: int
    search_params: ProductSearchRequest
