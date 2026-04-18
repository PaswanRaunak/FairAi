"""
FairLens AI — Explainability Routes
API endpoints for SHAP-based model explainability.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth.dependencies import get_current_user, CurrentUser
from explainability.shap_analyzer import compute_shap_values

router = APIRouter(prefix="/api/explain", tags=["Explainability"])


class ShapRequest(BaseModel):
    modelId: str


@router.post("/shap")
async def get_shap_values(req: ShapRequest, user: CurrentUser = Depends(get_current_user)):
    """Compute SHAP values for feature importance analysis."""
    try:
        result = compute_shap_values(req.modelId)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SHAP computation failed: {str(e)}")
