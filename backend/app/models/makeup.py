"""
GlamAI - Makeup Session Models
Models for makeup sessions, plans, and history
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from app.models.user import UserStyleSession
import enum


class OccasionType(str, enum.Enum):
    """Makeup occasion types"""
    DAILY = "daily"
    OFFICE = "office"
    PARTY = "party"
    WEDDING = "wedding"
    FESTIVE = "festive"
    DATE_NIGHT = "date_night"
    PHOTOSHOOT = "photoshoot"
    OTHER = "other"


class MakeupScope(str, enum.Enum):
    """Makeup application scope"""
    FULL_FACE = "full_face"
    EYES_ONLY = "eyes_only"
    LIPS_ONLY = "lips_only"
    TOUCH_UP = "touch_up"
    NO_MAKEUP_LOOK = "no_makeup_look"


class SessionStatus(str, enum.Enum):
    """Session completion status"""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class MakeupSession(Base):
    """Makeup session tracking"""
    __tablename__ = "makeup_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Session Details
    occasion = Column(Enum(OccasionType), nullable=False)
    scope = Column(Enum(MakeupScope), nullable=False)
    status = Column(Enum(SessionStatus), default=SessionStatus.IN_PROGRESS)
    
    # # Outfit & Accessories
    outfit_description = Column(Text, nullable=True)
    # outfit_image_url = Column(String(500), nullable=True)
    outfit_colors = Column(JSON, default=list)
    outfit_style = Column(String(100), nullable=True)
    
    accessories_data = Column(JSON, default=dict)  # Detected accessories
    # accessories_image_url = Column(String(500), nullable=True)
    # Link to a style session
    style_session_id = Column(Integer, ForeignKey("user_style_sessions.id"), nullable=True)
    style_session = relationship("UserStyleSession")

    # Hair Style
    hair_style_recommendation = Column(String(500), nullable=True)
    hair_style_chosen = Column(String(500), nullable=True)
    
    # AI Recommendations
    ai_suggestions = Column(JSON, default=dict)
    user_modifications = Column(JSON, default=dict)
    
    # Generated Makeup Plan
    makeup_plan = Column(JSON, default=dict)
    """
    Example structure:
    {
        "style": "Festive Glam",
        "eyes": {...},
        "cheeks": {...},
        "lips": {...},
        "base": {...}
    }
    """
    
    # Products Used
    products_used = Column(JSON, default=list)  # Array of product IDs
    products_needed = Column(JSON, default=list)  # Missing products
    substitutions_made = Column(JSON, default=list)
    
    # Session Progress
    current_step = Column(Integer, default=0)
    total_steps = Column(Integer, default=8)
    steps_completed = Column(JSON, default=list)
    
    # Final Result
    final_image_url = Column(String(500), nullable=True)
    final_feedback = Column(Text, nullable=True)
    user_rating = Column(Float, nullable=True)
    
    # Timing
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    
    # Mistakes & Corrections
    mistakes_logged = Column(JSON, default=list)
    corrections_applied = Column(JSON, default=list)
    
    # Safety Reminders Sent
    skin_safety_reminder_sent = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="makeup_sessions")
    
    def __repr__(self):
        return f"<MakeupSession {self.id} - {self.occasion.value}>"


class ScheduledEvent(Base):
    """Scheduled makeup events with calendar integration"""
    __tablename__ = "scheduled_events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Event Details
    event_name = Column(String(500), nullable=False)
    event_date = Column(DateTime(timezone=True), nullable=False)
    event_time = Column(String(10), nullable=True)  # "7:00 PM"
    occasion = Column(Enum(OccasionType), nullable=False)
    
    # Outfit Planning
    outfit_description = Column(Text, nullable=True)
    # outfit_image_url = Column(String(500), nullable=True)
    
    # Reminders
    remind_1_day_before = Column(Boolean, default=True)
    remind_2_hours_before = Column(Boolean, default=True)
    skincare_reminder_sent = Column(Boolean, default=False)
    makeup_reminder_sent = Column(Boolean, default=False)
    
    # Linked Session
    makeup_session_id = Column(Integer, ForeignKey("makeup_sessions.id"), nullable=True)
    session_completed = Column(Boolean, default=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_cancelled = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    style_session_id = Column(Integer, ForeignKey("user_style_sessions.id"), nullable=True)

    
    # Relationships
    user = relationship("User", back_populates="events")
    
    def __repr__(self):
        return f"<ScheduledEvent {self.event_name}>"


class MakeupHistory(Base):
    """Historical record of all makeup looks"""
    __tablename__ = "makeup_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("makeup_sessions.id"), nullable=False)
    style_session_id = Column(Integer, ForeignKey("user_style_sessions.id"), nullable=True)
    
    # Quick Reference
    look_name = Column(String(255), nullable=False)  # "Wedding Look - Dec 20"
    occasion = Column(Enum(OccasionType), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    
    # Quick Stats
    products_count = Column(Integer, default=0)
    duration_minutes = Column(Integer, default=0)
    user_rating = Column(Float, nullable=True)
    
    # Reusable
    is_favorite = Column(Boolean, default=False)
    times_repeated = Column(Integer, default=0)
    last_repeated = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    

    
    def __repr__(self):
        return f"<MakeupHistory {self.look_name}>"