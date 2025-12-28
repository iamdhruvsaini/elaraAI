"""
API v1 Router Configuration for GlamAI
"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    profile,
    makeup,
    vanity,
    events,
)

# ✅ Define main router for version 1
api_v1_router = APIRouter(prefix="/api/v1")

# ✅ Include all endpoint routers here
api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(profile.router, prefix="/profile", tags=["Profile"])
api_v1_router.include_router(makeup.router, prefix="/makeup", tags=["Makeup"])
api_v1_router.include_router(vanity.router, prefix="/vanity", tags=["Vanity | Products"])
api_v1_router.include_router(events.router, prefix="/events", tags=["Events"])
