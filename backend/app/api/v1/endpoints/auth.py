"""
GlamAI - Authentication Endpoints
Handles registration, login, OAuth, token refresh, and user session management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.db.database import get_db
from app.models.user import User, UserProfile, AuthProvider
from app.schemas.user import (
    UserRegister, UserLogin, OAuthLogin, Token,
    UserResponse, ProfileSetup
)
from app.core.security import (
    verify_password, get_password_hash,
    create_tokens, decode_token, validate_token_type
)
from app.api.deps.auth import get_current_user
from datetime import datetime
from loguru import logger

router = APIRouter()


# --------------------------------------------------------------------------
# 🧩 Register New User
# --------------------------------------------------------------------------
@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user with email or phone.
    """
    # print("Registering user: 🎉", user_data)
    # Validate if at least one identifier is provided
    if not user_data.email and not user_data.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or phone is required for registration."
        )

    # Build filters dynamically
    filters = []
    if user_data.email:
        filters.append(User.email == user_data.email)
    if user_data.phone:
        filters.append(User.phone == user_data.phone)

    # Check if user already exists
    query = select(User).where(or_(*filters))
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or phone already exists."
        )

    # Hash password
    hashed_password = get_password_hash(user_data.password)

    # Create new user record
    new_user = User(
        email=user_data.email,
        phone=user_data.phone,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        auth_provider=user_data.auth_provider,
        is_active=True,
        is_verified=False,
        last_login=datetime.utcnow()
    )

    db.add(new_user)
    await db.flush()  # ensure ID is assigned

    # Create associated user profile
    profile = UserProfile(user_id=new_user.id)
    db.add(profile)
    await db.commit()
    await db.refresh(new_user)

    # Generate JWT tokens
    tokens = create_tokens(new_user.id)
    logger.info(f"✅ New user registered: {new_user.id}")

    return tokens


# --------------------------------------------------------------------------
# 🔐 Login User
# --------------------------------------------------------------------------
@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate a user via email or phone and password.
    """
    if not credentials.email and not credentials.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either email or phone is required for login."
        )

    filters = []
    if credentials.email:
        filters.append(User.email == credentials.email)
    if credentials.phone:
        filters.append(User.phone == credentials.phone)

    query = select(User).where(or_(*filters))
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/phone or password."
        )

    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/phone or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive."
        )

    # Update last login timestamp
    user.last_login = datetime.utcnow()
    await db.commit()

    # Create JWTs
    tokens = create_tokens(user.id)
    logger.info(f"🔑 User logged in: {user.id}")

    return tokens


# --------------------------------------------------------------------------
# 🌐 OAuth (Google)
# --------------------------------------------------------------------------
@router.post("/oauth/google", response_model=Token)
async def oauth_login(
    oauth_data: OAuthLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Google OAuth login handler.
    """
    query = select(User).where(
        User.provider_id == oauth_data.provider_id,
        User.auth_provider == oauth_data.provider
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    # Create account if not found
    if not user:
        user = User(
            email=oauth_data.email,
            full_name=oauth_data.full_name,
            auth_provider=oauth_data.provider,
            provider_id=oauth_data.provider_id,
            is_active=True,
            is_verified=True,  # OAuth verified
            last_login=datetime.utcnow()
        )
        db.add(user)
        await db.flush()

        profile = UserProfile(user_id=user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(user)
        logger.info(f"🆕 New OAuth user created: {user.id}")
    else:
        user.last_login = datetime.utcnow()
        await db.commit()
        logger.info(f"🌍 OAuth user logged in: {user.id}")

    tokens = create_tokens(user.id)
    return tokens


# --------------------------------------------------------------------------
# 🔁 Refresh Token
# --------------------------------------------------------------------------
@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a new access token using the refresh token.
    """
    payload = decode_token(refresh_token)
    validate_token_type(payload, "refresh")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token."
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive."
        )

    tokens = create_tokens(user.id)
    logger.info(f"♻️ Token refreshed for user: {user.id}")
    return tokens


# --------------------------------------------------------------------------
# 🚪 Logout
# --------------------------------------------------------------------------
@router.post("/logout")
async def logout():
    """
    Logout (handled on client by deleting tokens).
    """
    return {"message": "Successfully logged out"}


# --------------------------------------------------------------------------
# 👤 Get Current User Info
# --------------------------------------------------------------------------
@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve authenticated user's information.
    """
    await db.refresh(current_user, ["profile"])
    logger.info(f"👤 User info fetched: {current_user.id}")
    return current_user
