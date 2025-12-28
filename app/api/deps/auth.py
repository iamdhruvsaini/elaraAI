"""
GlamAI - Authentication Dependencies
FastAPI dependencies for protecting routes
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.user import User
from app.core.security import decode_token, validate_token_type
from typing import Optional

security = HTTPBearer()



# app/api/deps/auth.py
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    validate_token_type(payload, "access")

    # ✅ Ensure we cast `sub` to int
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_verified_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current verified user"""
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )
    return current_user


async def get_current_premium_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current premium user"""
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required"
        )
    return current_user


def optional_authentication(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[int]:
    """
    Optional authentication - returns user_id if authenticated, None otherwise
    """
    if not credentials:
        return None
    
    try:
        payload = decode_token(credentials.credentials)
        validate_token_type(payload, "access")
        return payload.get("sub")
    except:
        return None
    
async def refresh_user_profile(db: AsyncSession, user: User):
    """Simple helper to refresh user's profile relationship."""
    await db.refresh(user, ["profile"])
    return user


async def db_refresh(db: AsyncSession = Depends(get_db),) -> AsyncSession:
    """Ensure DB session consistency and return new one."""
    await db.commit()
    await db.close()
    return await get_db()
