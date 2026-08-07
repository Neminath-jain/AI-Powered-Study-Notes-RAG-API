from fastapi import APIRouter, Depends
from backend.api.v1.auth import get_current_user
from backend.models.models import User
from backend.schemas.users import UserResponse

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details of the active user profile."""
    return current_user
