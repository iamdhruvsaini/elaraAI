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
    """User registration with email and password"""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = Field(None, description="Optional phone number")
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Ensure password has some complexity"""
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one number')
        if not any(char.isalpha() for char in v):
            raise ValueError('Password must contain at least one letter')
        return v
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        """Optional phone validation"""
        if v and not v.replace('+', '').replace('-', '').replace(' ', '').replace('(', '').replace(')', '').isdigit():
            raise ValueError('Invalid phone number format')
        return v


class UserLogin(BaseModel):
    """User login with email and password"""
    email: EmailStr
    password: str


class GoogleOAuthLogin(BaseModel):
    """Google OAuth login/registration"""
    google_id: str = Field(..., description="Unique Google user ID")
    email: EmailStr
    full_name: str
    
    @field_validator('google_id')
    @classmethod
    def validate_google_id(cls, v):
        if not v or len(v) < 10:
            raise ValueError('Invalid Google ID')
        return v


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    email: Optional[str] = None
    username: Optional[str] = None


class TokenPayload(BaseModel):
    """JWT Token payload"""
    sub: int  # user_id
    exp: datetime
    token_type: str = "access"  # "access" or "refresh"


class PasswordChange(BaseModel):
    """Change password request"""
    current_password: str
    new_password: str = Field(..., min_length=8)
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v):
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one number')
        if not any(char.isalpha() for char in v):
            raise ValueError('Password must contain at least one letter')
        return v


class EmailCheckResponse(BaseModel):
    """Email availability check response"""
    email: str
    available: bool
    message: str


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
    sensitivity_level: str = "normal"  # low, normal, high


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
    skin_tone: Optional[str] = None
    undertone: Optional[str] = None
    skin_type: Optional[str] = None
    skin_concerns: List[Dict[str, Any]] = []
    concern_details: Dict[str, Any] = {}
    
    # Allergies
    allergies: List[str] = []
    sensitivity_level: str = "normal"
    
    # Images
    face_image_url: Optional[str] = None
    
    # Preferences
    preferred_language: str = "en"
    enable_voice_guidance: bool = True
    enable_notifications: bool = True
    dark_mode: bool = False
    
    # Stats
    total_sessions: int = 0
    products_count: int = 0
    
    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """User response with profile"""
    id: int
    email: str
    full_name: Optional[str] = None
    age: Optional[int] = None
    location: Optional[str] = None
    auth_provider: AuthProvider
    is_active: bool
    is_verified: bool
    is_premium: bool
    created_at: datetime
    last_login: Optional[datetime] = None
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


# ============= Password Reset Schemas (Optional for future) =============

class PasswordResetRequest(BaseModel):
    """Request password reset email"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Confirm password reset with token"""
    token: str
    new_password: str = Field(..., min_length=8)
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one number')
        if not any(char.isalpha() for char in v):
            raise ValueError('Password must contain at least one letter')
        return v


class EmailVerificationRequest(BaseModel):
    """Request email verification"""
    email: EmailStr


class EmailVerificationConfirm(BaseModel):
    """Confirm email with token"""
    token: str


# ============= Response Models =============

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    """Error response"""
    detail: str
    error_code: Optional[str] = None