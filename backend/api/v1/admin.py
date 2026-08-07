# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
from backend.api.v1.auth import get_current_user, require_role
from backend.models.models import User, UserRole

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/dashboard", dependencies=[Depends(require_role([UserRole.ADMIN]))])
async def get_admin_dashboard():
    """Retrieve details from the administrative dashboard (Admin role required)."""
    return {"status": "ok", "message": "Welcome to the administrative controls."}
