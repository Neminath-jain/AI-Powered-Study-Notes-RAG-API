import uuid
from typing import Optional
from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db
from backend.core.security import decode_token
from backend.core.config import settings
from backend.core.exceptions import AuthenticationException
from backend.repositories.user import UserRepository
from backend.models.models import User, UserRole
from backend.schemas.auth import LoginRequest, TokenResponse, RefreshRequest
from backend.schemas.users import UserCreate, UserResponse
from backend.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Dependency to retrieve the currently authenticated user from access token."""
    if not token:
        raise AuthenticationException("Not authenticated")
        
    payload = decode_token(token, settings.JWT_SECRET)
    if not payload or payload.get("type") != "access":
        raise AuthenticationException("Could not validate credentials")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise AuthenticationException("Invalid token payload")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise AuthenticationException("Invalid user ID format")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise AuthenticationException("User is inactive or not found")
    return user

async def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Dependency to retrieve the currently authenticated user if token is provided, or None for guest access."""
    if not token:
        return None
    try:
        payload = decode_token(token, settings.JWT_SECRET)
        if not payload or payload.get("type") != "access":
            return None
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        user_id = uuid.UUID(user_id_str)
        user_repo = UserRepository(db)
        user = await user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            return None
        return user
    except Exception:
        return None

def require_role(allowed_roles: list[UserRole]):
    """Role-based access control dependency builder."""
    async def role_dependency(current_user: User = Depends(get_current_user)):
        from backend.core.exceptions import ForbiddenException
        if current_user.role not in allowed_roles:
            raise ForbiddenException("You do not have permission to access this resource")
        return current_user
    return role_dependency

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """User registration endpoint."""
    auth_service = AuthService(db)
    return await auth_service.register(user_in)

from fastapi import Request
from typing import Optional

@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """User login endpoint returning JWT credentials."""
    content_type = request.headers.get("content-type", "")
    if "application/x-www-form-urlencoded" in content_type:
        form_data = await request.form()
        email = form_data.get("username")
        password = form_data.get("password")
    else:
        try:
            json_data = await request.json()
            email = json_data.get("email")
            password = json_data.get("password")
        except Exception:
            raise AuthenticationException("Invalid request format")

    if not email or not password:
        raise AuthenticationException("Email and password are required")

    auth_service = AuthService(db)
    return await auth_service.login(email, password)

@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh user access token."""
    auth_service = AuthService(db)
    return await auth_service.refresh(body.refresh_token)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user session."""
    return current_user
