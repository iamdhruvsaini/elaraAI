"""
GlamAI - User Schemas
Pydantic models for request/response validation
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.user import AuthProvider


# ============= Authentication Schemas =============

class UserRegister(BaseModel):
    """User registration"""
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    auth_provider: AuthProvider = AuthProvider.EMAIL
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v and not v.replace('+', '').replace('-', '').replace(' ', '').isdigit():
            raise ValueError('Invalid phone number')
        return v


class UserLogin(BaseModel):
    """User login"""
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str


class OAuthLogin(BaseModel):
    """OAuth (Google) login"""
    provider: AuthProvider
    provider_id: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    access_token: str


class Token(BaseModel):
    """JWT Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseModel):
    """JWT Token payload"""
    sub: int  # user_id
    exp: datetime


# ============= Profile Schemas =============

class ProfileSetup(BaseModel):
    """Initial profile setup after registration"""
    full_name: str
    age: Optional[int] = Field(None, ge=13, le=100)
    location: Optional[str] = None


class SkinAnalysisResult(BaseModel):
    """Skin analysis from face image"""
    skin_tone: str  # Light, Medium, Dark
    undertone: str  # Warm, Cool, Neutral
    skin_type: str  # Dry, Oily, Combination, Normal
    confidence: float = Field(..., ge=0.0, le=1.0)
    raw_data: Optional[Dict[str, Any]] = None


class SkinConcernDetail(BaseModel):
    """Detailed skin concern information"""
    concern_type: str  # acne, pigmentation, dark_spots, etc.
    severity: str  # mild, moderate, severe
    locations: List[str]  # ["forehead", "cheeks"]
    detected_automatically: bool = False


class AllergyProfile(BaseModel):
    """User allergy and sensitivity profile"""
    allergies: List[str] = []  # ["parabens", "fragrances"]
    sensitivity_level: str = "normal"  # low, moderate, high


class ProfileUpdate(BaseModel):
    """Update user profile"""
    full_name: Optional[str] = None
    age: Optional[int] = Field(None, ge=13, le=100)
    location: Optional[str] = None
    skin_tone: Optional[str] = None
    undertone: Optional[str] = None
    skin_type: Optional[str] = None
    skin_concerns: Optional[List[SkinConcernDetail]] = None
    allergies: Optional[List[str]] = None
    sensitivity_level: Optional[str] = None
    preferred_language: Optional[str] = None
    enable_voice_guidance: Optional[bool] = None
    enable_notifications: Optional[bool] = None
    dark_mode: Optional[bool] = None


class UserProfileResponse(BaseModel):
    """Complete user profile response"""
    id: int
    user_id: int
    
    # Skin Analysis
    skin_tone: Optional[str]
    undertone: Optional[str]
    skin_type: Optional[str]
    skin_concerns: List[Dict[str, Any]] = []
    concern_details: Dict[str, Any] = {}
    
    # Allergies
    allergies: List[str] = []
    sensitivity_level: str
    
    # Images
    face_image_url: Optional[str]
    
    # Preferences
    preferred_language: str
    enable_voice_guidance: bool
    enable_notifications: bool
    dark_mode: bool
    
    # Stats
    total_sessions: int
    products_count: int
    
    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """User response with profile"""
    id: int
    email: Optional[str]
    phone: Optional[str]
    full_name: Optional[str]
    age: Optional[int]
    location: Optional[str]
    auth_provider: AuthProvider
    is_active: bool
    is_verified: bool
    is_premium: bool
    created_at: datetime
    last_login: Optional[datetime]
    profile: Optional[UserProfileResponse] = None
    
    class Config:
        from_attributes = True


# ============= Dashboard Schemas =============

class UserStats(BaseModel):
    """User statistics for dashboard"""
    total_sessions: int
    products_in_vanity: int
    upcoming_events: int
    total_looks_saved: int
    favorite_products: int


class DashboardResponse(BaseModel):
    """Dashboard data"""
    user: UserResponse
    stats: UserStats
    upcoming_events: List[Dict[str, Any]] = []
    recent_sessions: List[Dict[str, Any]] = []
    quick_tips: List[str] = []