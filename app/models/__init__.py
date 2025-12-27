"""
GlamAI - Database Models
Central import for all database models
"""

from app.models.user import User, UserProfile, AuthProvider,UserStyleSession
from app.models.vanity import VanityProduct, ProductDatabase, ProductCategory
from app.models.makeup import (
    MakeupSession, ScheduledEvent, MakeupHistory,
    OccasionType, MakeupScope, SessionStatus
)

__all__ = [
    # User models
    "User",
    "UserProfile",
    "AuthProvider",
    "UserStyleSession",
    
    # Vanity models
    "VanityProduct",
    "ProductDatabase",
    "ProductCategory",
    
    # Makeup models
    "MakeupSession",
    "ScheduledEvent",
    "MakeupHistory",
    "OccasionType",
    "MakeupScope",
    "SessionStatus",
]