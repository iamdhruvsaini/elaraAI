"""
GlamAI - User Models
Database models for user authentication and profiles
"""

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum,
    Text, JSON, ForeignKey, func, Float
)
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class AuthProvider(str, enum.Enum):
    """Authentication provider types"""
    EMAIL = "email"
    GOOGLE = "google"
    PHONE = "phone"


class User(Base):
    """Main User model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    
    # Provider info
    auth_provider = Column(Enum(AuthProvider), default=AuthProvider.EMAIL)
    provider_id = Column(String(255), nullable=True)  # Google/OAuth ID
    
    # Basic Info
    full_name = Column(String(255), nullable=True)
    age = Column(Integer, nullable=True)
    location = Column(String(255), nullable=True)
    
    # Account Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_premium = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # ✅ Relationships
    profile = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    vanity = relationship("VanityProduct", back_populates="user", cascade="all, delete-orphan")
    makeup_sessions = relationship("MakeupSession", back_populates="user", cascade="all, delete-orphan")
    events = relationship("ScheduledEvent", back_populates="user", cascade="all, delete-orphan")
    style_sessions = relationship("UserStyleSession", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.email or self.phone}>"


class UserProfile(Base):
    """Extended user profile with skin analysis"""
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)

    # ✅ FIXED: Proper foreign key linking to users.id
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Skin Analysis
    skin_tone = Column(String(50), nullable=True)  # Light, Medium, Dark
    undertone = Column(String(50), nullable=True)  # Warm, Cool, Neutral
    skin_type = Column(String(50), nullable=True)  # Dry, Oily, Combination, Normal
    
    # Skin Concerns (JSON array)
    skin_concerns = Column(JSON, default=list)
    concern_details = Column(JSON, default=dict)
    
    # Allergies & Sensitivities
    allergies = Column(JSON, default=list)
    sensitivity_level = Column(String(50), default="normal")
    
    # Face Image Storage
    face_image_url = Column(String(500), nullable=True)
    face_analysis_data = Column(JSON, default=dict)
    
    # Preferences
    preferred_language = Column(String(10), default="en")
    enable_voice_guidance = Column(Boolean, default=True)
    enable_notifications = Column(Boolean, default=True)
    dark_mode = Column(Boolean, default=False)
    
    # Stats
    total_sessions = Column(Integer, default=0)
    products_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # ✅ Relationship back to user
    user = relationship("User", back_populates="profile")
    
    def __repr__(self):
        return f"<UserProfile user_id={self.user_id}>"
class UserStyleSession(Base):
    """
    Dynamic outfit + accessories log for a user
    """
    __tablename__ = "user_style_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Outfit info
    outfit_description = Column(Text, nullable=True)
    outfit_type = Column(String(100), nullable=True)
    outfit_colors = Column(JSON, default=list)

    # Accessories info
    # Example:
    # {
    #   "ear": {"item": "jhumka", "material": "gold", "color": {"name": "Rose Pink", "hex": "#FF66B2"}},
    #   "hand": {"item": "bangle", "material": "silver", "color": {"name": "Lavender", "hex": "#E6E6FA"}}
    # }
    accessories = Column(JSON, default=dict)

    # Confidence and timestamp
    confidence = Column(Float, default=0.9)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ✅ Correct Relationship — only one
    user = relationship("User", back_populates="style_sessions")
