"""
GlamAI - Makeup Session Schemas
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any,Union
from datetime import datetime
from app.models.makeup import OccasionType, MakeupScope, SessionStatus
from app.models.makeup import OccasionType  # Import the enum


# ============= Session Creation =============

class SessionStart(BaseModel):
    """Start a new makeup session"""
    occasion: OccasionType
    scope: MakeupScope
    outfit_description: Optional[str] = None
    scheduled_event_id: Optional[int] = None


class AccessoryItem(BaseModel):
    item: Optional[str]
    material: Optional[str]
    color: Optional[str] = None

from pydantic import BaseModel, Field, field_serializer,field_validator


# ============= Style Session =============x``
class StyleSessionCreate(BaseModel):
    description: Optional[str] = Field(None, description="Text describing outfit and look")
    accessories: Optional[Dict[str, Any]] = Field(
        None,
        description="Optional manual accessory selection"
    )


class StyleSessionResponse(BaseModel):
    id: int
    outfit_description: Optional[str] = None
    outfit_type: Optional[str] = None
    outfit_colors: List[str] = []
    accessories: Dict[str, Any] = {}
    confidence: float = 0.9
    created_at: Optional[datetime] = None  # ✅ keep as datetime, we’ll serialize below
    message: Optional[str] = None

    # 👇 This is the new part
    @field_serializer("created_at")
    def serialize_created_at(self, created_at: Optional[datetime], _info):
        """Convert datetime → ISO string for API response"""
        return created_at.isoformat() if created_at else None

    class Config:
        from_attributes = True
# ============= Hair Style Suggestion & AI Recommendations =============

class HairStyleSuggestion(BaseModel):
    """AI hair style recommendation"""
    recommended_style: str
    alternatives: List[str] = []
    reasoning: str
    reference_image_url: Optional[str] = None
    tips: List[str] = []


class AIRecommendation(BaseModel):
    """AI suggestions for accessories and makeup"""
    keep_accessories: List[str] = []
    remove_accessories: List[str] = []
    change_accessories: List[str] = []
    reasoning: str
    makeup_style: str
    intensity: str  # subtle, moderate, bold


# ============= Makeup Plan =============

class MakeupStep(BaseModel):
    """Individual makeup step"""
    step_number: int
    category: str  # foundation, eyes, lips, etc.
    instruction: str
    tool_needed: Optional[str] = None
    amount: Optional[str] = None
    location: Optional[str] = None
    technique: Optional[str] = None
    expected_result: str
    video_url: Optional[str] = None
    tips: List[str] = []


class MakeupPlan(BaseModel):
    """Complete makeup plan"""
    occasion: Optional[str] = None
    scope: Optional[str] = None
    style: str
    reasoning: Optional[str]
    intensity: Optional[str]
    steps: List[Dict]
    key_focus: Optional[List[str]]
    estimated_duration: Optional[int]
    difficulty: Optional[str]


class ProductMatch(BaseModel):
    """Product matching result"""
    category: str
    needed: bool
    has_product: bool
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    substitution_available: bool = False
    substitution_suggestion: Optional[str] = None
    purchase_link: Optional[str] = None
    is_safe: bool = True
    safety_warnings: List[str] = []


# ============= Session Progress =============

class StepCompletion(BaseModel):
    """Mark step as complete"""
    session_id: int
    step_number: int
    notes: Optional[str] = None
    issue_encountered: bool = False


class MistakeReport(BaseModel):
    """Report a mistake during makeup"""
    session_id: int
    step_number: int
    issue_type: str  # smudged, uneven, too_dark, etc.
    description: Optional[str] = None


class MistakeFix(BaseModel):
    """Fix suggestion for mistake"""
    fix_steps: List[str]
    prevention_tips: List[str]
    estimated_fix_time: int  # minutes


# ============= Session Completion =============

class FinalLookSubmit(BaseModel):
    """Submit final makeup look"""
    session_id: int
    rating: float = Field(..., ge=1.0, le=5.0)
    feedback: Optional[str] = None
    what_liked: List[str] = []
    issues_faced: List[str] = []


class FinalLookAnalysis(BaseModel):
    """AI analysis of final look"""
    overall_balance: str
    accessory_compatibility: str
    suggestions: List[str] = []
    compliments: List[str] = []


# ============= Session Response =============

class MakeupSessionResponse(BaseModel):
    """Complete makeup session details"""
    id: int
    user_id: int
    occasion: OccasionType
    scope: MakeupScope
    status: SessionStatus
    
    # Outfit & Accessories
    outfit_description: Optional[str]
    # outfit_image_url: Optional[str]
    outfit_colors: List[str] = []
    accessories_data: Dict[str, Any] = {}
    
    # Hair
    hair_style_recommendation: Optional[str]
    hair_style_chosen: Optional[str]
    
    # Plan & Products
    makeup_plan: Dict[str, Any] = {}
    products_used: List[int] = []
    products_needed: List[int] = []
    
    # Progress
    current_step: int
    total_steps: int
    steps_completed: List[int] = []
    
    # Results
    final_image_url: Optional[str]
    user_rating: Optional[float]
    
    # Timing
    started_at: datetime
    completed_at: Optional[datetime]
    duration_minutes: Optional[int]
    
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ============= Scheduled Events =============




"""
Event Schemas - Simplified without outfit/accessory URLs
Add to or replace in: app/schemas/makeup.py
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, time


class EventCreate(BaseModel):
    """Schema for creating a new event"""
    event_name: str = Field(..., min_length=1, max_length=200)
    event_date: datetime
    event_time: Optional[time] = None
    occasion: str = Field(..., min_length=1, max_length=100)
    outfit_description: Optional[str] = None
    remind_1_day_before: bool = False
    remind_2_hours_before: bool = False


class EventUpdate(BaseModel):
    """Schema for updating an event"""
    event_name: Optional[str] = Field(None, min_length=1, max_length=200)
    event_date: Optional[datetime] = None
    event_time: Optional[time] = None
    occasion: Optional[str] = Field(None, min_length=1, max_length=100)
    outfit_description: Optional[str] = None
    remind_1_day_before: Optional[bool] = None
    remind_2_hours_before: Optional[bool] = None


class EventResponse(BaseModel):
    """Schema for event response - NO outfit_image_url"""
    id: int
    user_id: int
    event_name: str
    event_date: datetime
    event_time: Optional[time] = None
    occasion: str
    outfit_description: Optional[str] = None
    # REMOVED: outfit_image_url
    makeup_session_id: Optional[int] = None
    
    # Reminder settings
    remind_1_day_before: bool = False
    remind_2_hours_before: bool = False
    skincare_reminder_sent: bool = False
    makeup_reminder_sent: bool = False
    
    # Status
    is_active: bool = True
    is_cancelled: bool = False
    session_completed: bool = False
    
    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Pydantic v2
        # orm_mode = True  # Pydantic v1


class EventListResponse(BaseModel):
    """Schema for list of events"""
    events: list[EventResponse]
    total: int
    upcoming: int
    past: int
# ============= History =============

class HistoryItem(BaseModel):
    """Single history item"""
    id: int
    look_name: str
    occasion: OccasionType
    thumbnail_url: Optional[str]
    products_count: int
    duration_minutes: int
    user_rating: Optional[float]
    is_favorite: bool
    times_repeated: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class HistoryListResponse(BaseModel):
    """List of history items"""
    items: List[HistoryItem]
    total: int
    page: int
    page_size: int