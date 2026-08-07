from fastapi import APIRouter, Depends
from backend.api.v1.auth import get_current_user
from backend.models.models import User
from backend.core.config import settings

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("")
async def get_settings(current_user: User = Depends(get_current_user)):
    """Retrieve config variables scoped for client usage (e.g. models, scores thresholds)."""
    return {
        "score_threshold": settings.SCORE_THRESHOLD,
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "llm_model": settings.LLM_MODEL,
        "storage_type": settings.STORAGE_TYPE,
    }
