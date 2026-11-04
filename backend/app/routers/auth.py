"""
Fresco — Auth Router
=======================
Handles user registration and login.

Endpoints:
    POST /api/auth/register — Create a new account
    POST /api/auth/login    — Login and receive JWT
    GET  /api/auth/me       — Validate a token and return the current user

Security notes:
    - Passwords stored as bcrypt hashes (never plaintext)
    - JWT tokens expire after settings.access_token_expire_minutes
    - Same error message for both "user not found" and "wrong password" (prevents enumeration)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.schema import User
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.schemas.schemas import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserPublic,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=201,
    summary="Register a new user",
    description="Create a new account. Returns a JWT token on success.",
)
async def register(
    data: UserRegister,
    db: AsyncSession = Depends(get_db),
):
    """
    Registration flow:
        1. Check username uniqueness
        2. Check email uniqueness
        3. Hash password
        4. Create user in database
        5. Generate JWT
        6. Return token + user data
    """
    # Check username
    existing = await db.execute(
        select(User).where(User.username == data.username)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )

    # Check email
    existing = await db.execute(
        select(User).where(User.email == data.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create user
    user = User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Generate token
    token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=token,
        user=UserPublic.model_validate(user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login",
    description="Authenticate with email and password. Returns a JWT token.",
)
async def login(
    data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    Login flow:
        1. Find user by email
        2. Verify password
        3. Generate JWT
        4. Return token + user data

    Uses same error message for all failures to prevent user enumeration.
    """
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == data.email)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate token
    token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=token,
        user=UserPublic.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserPublic,
    summary="Current user",
    description=(
        "Validate the bearer token and return the authenticated user. "
        "The mobile app calls this on boot so an expired token is detected "
        "immediately instead of failing later on a data screen."
    ),
)
async def read_current_user(
    user: User = Depends(get_current_user),
):
    """
    Token-validation endpoint.

    `get_current_user` already enforces signature, expiry, and user
    existence, so a 200 here means the stored session is still usable.
    """
    return UserPublic.model_validate(user)
