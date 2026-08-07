import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from backend.repositories.user import UserRepository
from backend.models.models import User, UserRole
from backend.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from backend.core.config import settings
from backend.core.exceptions import AuthenticationException, ValidationException
from backend.schemas.auth import TokenResponse
from backend.schemas.users import UserCreate

class AuthService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)

    async def register(self, user_in: UserCreate) -> User:
        """Register a new user in the system after validating email uniqueness."""
        existing = await self.user_repo.get_by_email(user_in.email)
        if existing:
            raise ValidationException("Email already registered")

        hashed_password = get_password_hash(user_in.password)
        new_user = User(
            email=user_in.email,
            hashed_password=hashed_password,
            role=UserRole.STUDENT,
            is_active=True,
            is_verified=False,
        )
        return await self.user_repo.add(new_user)

    async def login(self, email: str, password: str) -> TokenResponse:
        """Validate credentials and issue new access & refresh JWT tokens."""
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise AuthenticationException("Incorrect email or password")

        if not user.is_active:
            raise AuthenticationException("User account is disabled")

        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """Issue new tokens by validating an existing, active refresh token."""
        payload = decode_token(refresh_token, settings.JWT_REFRESH_SECRET)
        if not payload or payload.get("type") != "refresh":
            raise AuthenticationException("Invalid or expired refresh token")

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise AuthenticationException("Invalid token payload")

        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            raise AuthenticationException("Invalid user identity")

        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise AuthenticationException("User is inactive or not found")

        new_access_token = create_access_token(user.id)
        new_refresh_token = create_refresh_token(user.id)
        return TokenResponse(access_token=new_access_token, refresh_token=new_refresh_token)
