"""
GlamAI - Complete Unified Authentication System
Supports both manual registration (email/password) and Google OAuth
Users can login with either email/password OR Google
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.db.database import get_db
from app.models.user import User, UserProfile, AuthProvider
from app.schemas.user import (
    UserRegister, UserLogin, GoogleOAuthLogin, Token,
    UserResponse
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
# 🧩 REGISTER - Manual Registration (Email/Password)
# --------------------------------------------------------------------------
@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user with email, password, and optional phone.
    Creates a standard EMAIL auth account.
    """
    # Check if email already exists
    query = select(User).where(User.email == user_data.email)
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        # Check what type of account exists
        if existing_user.auth_provider == AuthProvider.GOOGLE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists via Google. Please sign in with Google."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists. Please login."
            )

    # Hash password
    hashed_password = get_password_hash(user_data.password)

    # Create new user
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        phone=getattr(user_data, 'phone', None),  # Optional phone
        auth_provider=AuthProvider.EMAIL,
        is_active=True,
        is_verified=False,
        last_login=datetime.utcnow()
    )

    db.add(new_user)
    await db.flush()

    # Create user profile
    profile = UserProfile(user_id=new_user.id)
    db.add(profile)
    await db.commit()
    await db.refresh(new_user)

    # Generate tokens
    tokens = create_tokens(new_user.id)
    logger.info(f"✅ New user registered: {new_user.email} (EMAIL)")

    return {
        **tokens,
        "email": new_user.email,
        "username": new_user.full_name
    }



# --------------------------------------------------------------------------
# 🌐 REGISTER/LOGIN - Google OAuth
# --------------------------------------------------------------------------
@router.post("/oauth/google", response_model=Token)
async def google_oauth(
    oauth_data: GoogleOAuthLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Google OAuth - handles both registration and login.
    
    Flow:
    1. Check if user exists by Google ID
    2. If not, check by email
    3. If email exists with EMAIL provider, link accounts
    4. If no user exists, create new Google account
    5. Return JWT tokens
    """
    
    # Step 1: Try to find user by Google ID (most reliable)
    query = select(User).where(User.provider_id == oauth_data.google_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user:
        # Existing Google user - just login
        user.last_login = datetime.utcnow()
        await db.commit()
        logger.info(f"🌍 Google user logged in: {user.email}")
        
        tokens = create_tokens(user.id)
        return tokens

    # Step 2: User not found by Google ID, check by email
    query = select(User).where(User.email == oauth_data.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user:
        # User exists with same email but registered via EMAIL provider
        # OPTION A: Link the accounts (recommended)
        if user.auth_provider == AuthProvider.EMAIL:
            # Link Google to existing email account
            user.provider_id = oauth_data.google_id
            user.auth_provider = AuthProvider.GOOGLE  # Upgrade to Google auth
            user.is_verified = True  # Google accounts are verified
            user.last_login = datetime.utcnow()
            await db.commit()
            
            logger.info(f"🔗 Linked Google account to existing email: {user.email}")
            tokens = create_tokens(user.id)
            return tokens
        
        # OPTION B: Reject if you don't want account linking (uncomment below)
        # raise HTTPException(
        #     status_code=status.HTTP_400_BAD_REQUEST,
        #     detail="An account with this email already exists. Please login with email/password."
        # )

    # Step 3: No user found - Create new Google account
    new_user = User(
        email=oauth_data.email,
        full_name=oauth_data.full_name,
        auth_provider=AuthProvider.GOOGLE,
        provider_id=oauth_data.google_id,
        is_active=True,
        is_verified=True,  # Google users are pre-verified
        last_login=datetime.utcnow()
    )
    
    db.add(new_user)
    await db.flush()

    # Create user profile
    profile = UserProfile(user_id=new_user.id)
    db.add(profile)
    await db.commit()
    await db.refresh(new_user)

    logger.info(f"🆕 New Google user created: {new_user.email}")
    
    tokens = create_tokens(new_user.id)
    return {
        **tokens,
        "email": user.email if user else new_user.email,
        "username": user.full_name if user else new_user.full_name
    }

# --------------------------------------------------------------------------
# 🔐 LOGIN - Email/Password
# --------------------------------------------------------------------------
@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password.
    Only works for accounts created with email/password.
    """
    # Find user by email
    query = select(User).where(User.email == credentials.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Check if account was created via Google (no password)
    if user.auth_provider == AuthProvider.GOOGLE and not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account uses Google Sign-In. Please sign in with Google."
        )

    # Verify password
    if not user.hashed_password or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support."
        )

    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()

    # Generate tokens
    tokens = create_tokens(user.id)
    logger.info(f"🔑 User logged in: {user.email} (EMAIL)")

    return {
        **tokens,
        "email": user.email,
        "username": user.full_name
    }



# --------------------------------------------------------------------------
# 🔁 REFRESH TOKEN
# --------------------------------------------------------------------------
@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate new access token using refresh token.
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
            detail="User not found or account inactive."
        )

    tokens = create_tokens(user.id)
    logger.info(f"♻️ Token refreshed: {user.email}")
    return tokens


# --------------------------------------------------------------------------
# 🚪 LOGOUT
# --------------------------------------------------------------------------
@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout (client-side token deletion).
    """
    logger.info(f"👋 User logged out: {current_user.email}")
    return {"message": "Successfully logged out"}


# --------------------------------------------------------------------------
# 👤 GET CURRENT USER
# --------------------------------------------------------------------------
@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user's info with profile.
    """
    await db.refresh(current_user, ["profile"])
    logger.info(f"👤 User info fetched: {current_user.email}")
    return current_user


# --------------------------------------------------------------------------
# 📧 CHECK EMAIL AVAILABILITY
# --------------------------------------------------------------------------
@router.get("/check-email/{email}")
async def check_email_availability(
    email: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Check if email is already registered.
    """
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user:
        provider_message = f"Email is registered via {user.auth_provider.value}"
    else:
        provider_message = "Email is available"

    return {
        "email": email,
        "available": user is None,
        "message": provider_message,
        "auth_provider": user.auth_provider.value if user else None
    }


# --------------------------------------------------------------------------
# 🔒 CHANGE PASSWORD (Email accounts only)
# --------------------------------------------------------------------------
@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change password for email-authenticated users only.
    """
    # Only EMAIL accounts can change password
    if current_user.auth_provider != AuthProvider.EMAIL or not current_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password change is only available for email/password accounts."
        )

    # Verify current password
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect."
        )

    # Validate new password
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters."
        )

    if not any(c.isdigit() for c in new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number."
        )

    if not any(c.isalpha() for c in new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one letter."
        )

    # Update password
    current_user.hashed_password = get_password_hash(new_password)
    await db.commit()

    logger.info(f"🔐 Password changed: {current_user.email}")
    return {"message": "Password successfully changed"}


# --------------------------------------------------------------------------
# 🔗 LINK GOOGLE ACCOUNT (Optional - for existing email users)
# --------------------------------------------------------------------------
@router.post("/link-google")
async def link_google_account(
    oauth_data: GoogleOAuthLogin,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Link Google account to existing email/password account.
    Allows users to login with either method after linking.
    """
    # Check if Google account is already linked to another user
    query = select(User).where(User.provider_id == oauth_data.google_id)
    result = await db.execute(query)
    existing_google_user = result.scalar_one_or_none()

    if existing_google_user and existing_google_user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This Google account is already linked to another user."
        )

    # Check if email matches
    if oauth_data.email != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email must match your account email."
        )

    # Link the account
    current_user.provider_id = oauth_data.google_id
    # Keep auth_provider as EMAIL or upgrade to GOOGLE (your choice)
    # current_user.auth_provider = AuthProvider.GOOGLE
    current_user.is_verified = True
    await db.commit()

    logger.info(f"🔗 Google account linked: {current_user.email}")
    return {"message": "Google account successfully linked"}