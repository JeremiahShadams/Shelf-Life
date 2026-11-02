import hashlib
import base64
from datetime import datetime, timedelta

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.schema import User

settings = get_settings()

# ============================================
# Password Hashing (bcrypt direct — no passlib)
# ============================================


def _prehash(password: str) -> bytes:
    """SHA-256 pre-hash to handle bcrypt's 72-byte limit.
    Returns bytes ready for bcrypt.hashpw()."""
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest)


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(_prehash(password), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its bcrypt hash."""
    return bcrypt.checkpw(
        _prehash(plain_password),
        hashed_password.encode("utf-8"),
    )


# ============================================
# JWT Token Management
# ============================================

ALGORITHM = "HS256"

# OAuth2 scheme — tells FastAPI where to look for the token
# (Authorization: Bearer <token> header)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a JWT access token.

    Args:
        data: Payload to encode (must include 'sub' for user identification)
        expires_delta: Custom expiry duration (defaults to settings.access_token_expire_minutes)

    Returns:
        Encoded JWT string
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


# ============================================
# FastAPI Dependency — Get Authenticated User
# ============================================

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency that:
        1. Extracts JWT from the Authorization header
        2. Decodes and validates it
        3. Loads the user from the database
        4. Returns the User ORM object

    Raises 401 if the token is invalid, expired, or user doesn't exist.

    Usage in routes:
        @router.get("/protected")
        async def protected(user: User = Depends(get_current_user)):
            ...
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exception
        user_id = int(sub)
    except (JWTError, ValueError):
        raise credentials_exception

    # Query user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user
