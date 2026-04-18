"""
FairLens AI — Simulation Routes
API endpoints for fairness simulation lab.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth.dependencies import get_current_user, CurrentUser
from simulation.simulator import simulate_threshold

router = APIRouter(prefix="/api/simulate", tags=["Simulation"])


class ThresholdSimRequest(BaseModel):
    modelId: str
    sensitiveAttribute: str
    thresholds: dict[str, float]


@router.post("/threshold")
async def run_simulation(req: ThresholdSimRequest, user: CurrentUser = Depends(get_current_user)):
    """Run threshold simulation and compare before/after fairness metrics."""
    try:
        result = simulate_threshold(
            model_id=req.modelId,
            sensitive_attribute=req.sensitiveAttribute,
            thresholds=req.thresholds,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")
