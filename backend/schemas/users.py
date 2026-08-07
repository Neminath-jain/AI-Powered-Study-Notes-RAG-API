import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from backend.models.models import UserRole

class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.STUDENT

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: UserRole
    is_verified: bool
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
