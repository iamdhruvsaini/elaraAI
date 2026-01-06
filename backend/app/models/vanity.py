"""
GlamAI - Vanity/Product Models
Enhanced for AI-enriched product management and intelligent ingredient analysis
"""

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Enum,
    ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum


# ======================================================
# 🧴 Product Category Enum (same, kept for compatibility)
# ======================================================
class ProductCategory(str, enum.Enum):
    """Supported product categories"""
    FOUNDATION = "foundation"
    CONCEALER = "concealer"
    POWDER = "powder"
    BLUSH = "blush"
    BRONZER = "bronzer"
    HIGHLIGHTER = "highlighter"
    EYESHADOW = "eyeshadow"
    EYELINER = "eyeliner"
    KAJAL = "kajal"
    MASCARA = "mascara"
    EYEBROW = "eyebrow"
    LIPSTICK = "lipstick"
    LIP_GLOSS = "lip_gloss"
    LIP_LINER = "lip_liner"
    PRIMER = "primer"
    SETTING_SPRAY = "setting_spray"
    TOOLS = "tools"
    OTHER = "other"


# ======================================================
# 💄 User Vanity Product Model
# ======================================================
class VanityProduct(Base):
    """
    User's personal product inventory item.

    ✨ Now supports:
      - AI enrichment metadata (auto-filled via LLM/RAG)
      - Ingredient-level safety analysis
      - Source traceability (manual, AI, RAG)
      - Flexible product info structure
    """
    __tablename__ = "vanity_products"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 📦 Basic Details (user-provided or AI-inferred)
    category = Column(Enum(ProductCategory), nullable=True)
    brand = Column(String(255), nullable=True)
    product_name = Column(String(500), nullable=False)
    shade = Column(String(255), nullable=True)
    
    # 🖼️ Product Info
    product_image_url = Column(String(500), nullable=True)
    barcode = Column(String(100), nullable=True)
    purchase_date = Column(DateTime(timezone=True), nullable=True)
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    price = Column(Float, nullable=True)
    
    # 🧠 AI Enrichment Metadata
    description = Column(Text, nullable=True)
    product_source = Column(String(50), default="manual")  # manual | ai | rag | web
    enrichment_confidence = Column(Float, default=0.9)
    meta_data = Column(JSON, default=dict)  # store misc AI enrichment data (like rating, store link, etc.)

    # 🧴 Ingredients & Safety
    ingredients = Column(JSON, default=list)
    is_safe_for_user = Column(Boolean, default=True)
    safety_warnings = Column(JSON, default=list)
    skin_safety_rating = Column(Float, nullable=True)
    allergy_conflicts = Column(JSON, default=list)

    # 📊 Usage Stats
    times_used = Column(Integer, default=0)
    last_used = Column(DateTime(timezone=True), nullable=True)
    is_favorite = Column(Boolean, default=False)
    rating = Column(Float, nullable=True)
    
    # 🗒️ Notes & Tags
    notes = Column(Text, nullable=True)
    tags = Column(JSON, default=list)
    
    # ✅ Status
    is_active = Column(Boolean, default=True)
    is_finished = Column(Boolean, default=False)
    
    # 🕓 Audit Trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 🔗 Relationships
    user = relationship("User", back_populates="vanity")

    def __repr__(self):
        return f"<VanityProduct {self.brand or 'Unknown'} - {self.product_name}>"
    

# ======================================================
# 🌍 Global Product Database (RAG-backed catalog)
# ======================================================
class ProductDatabase(Base):
    """
    Central AI/RAG product database.
    Used for auto-enrichment, safety validation, and recommendations.
    """
    __tablename__ = "product_database"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 🧴 Product Details
    category = Column(Enum(ProductCategory), nullable=True, index=True)
    brand = Column(String(255), nullable=True, index=True)
    product_name = Column(String(500), nullable=False)
    shade = Column(String(255), nullable=True)
    
    # 🌐 Product Info
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    product_url = Column(String(500), nullable=True)
    
    # 💰 Pricing
    price = Column(Float, nullable=True)
    currency = Column(String(10), default="INR")
    
    # 🧠 Ingredients
    ingredients = Column(JSON, default=list)
    key_ingredients = Column(JSON, default=list)
    
    # 💧 Suitability
    suitable_skin_tones = Column(JSON, default=list)
    suitable_skin_types = Column(JSON, default=list)
    suitable_undertones = Column(JSON, default=list)
    
    # ⚕️ Safety & Allergens
    avoids_concerns = Column(JSON, default=list)
    allergen_free = Column(JSON, default=list)
    
    # ⭐ Ratings & Reviews
    average_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    
    # 🛍️ Affiliate Links
    affiliate_link_nykaa = Column(String(500), nullable=True)
    affiliate_link_amazon = Column(String(500), nullable=True)
    
    # 🏷️ Tags & Filters
    tags = Column(JSON, default=list)
    
    # 📦 Availability
    is_active = Column(Boolean, default=True)
    in_stock = Column(Boolean, default=True)
    
    # 🕓 Audit Trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    
    def __repr__(self):
        return f"<ProductDB {self.brand or 'Unknown'} - {self.product_name}>"
