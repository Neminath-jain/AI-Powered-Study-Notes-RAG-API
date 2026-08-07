from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from backend.core.config import settings

import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if the provided password matches the stored hash instantly using pure bcrypt."""
    try:
        if not plain_password or not hashed_password:
            return False
        return bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        logger.warning("Password verification check failed", error=str(e))
        return False

def get_password_hash(password: str) -> str:
    """Generate a fast bcrypt hash of the password."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_token(data: dict, secret: str, expires_delta: timedelta) -> str:
    """Generic helper to construct a signed JWT token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(to_encode, secret, algorithm="HS256")
    return encoded_jwt

def create_access_token(subject: Any) -> str:
    """Create a short-lived access JWT token."""
    expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_token(
        data={"sub": str(subject), "type": "access"},
        secret=settings.JWT_SECRET,
        expires_delta=expires,
    )

def create_refresh_token(subject: Any) -> str:
    """Create a long-lived refresh JWT token."""
    expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return create_token(
        data={"sub": str(subject), "type": "refresh"},
        secret=settings.JWT_REFRESH_SECRET,
        expires_delta=expires,
    )

def decode_token(token: str, secret: str) -> Optional[Dict[str, Any]]:
    """Decode a JWT and return its payload if valid, otherwise None."""
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload
    except JWTError:
        return None
