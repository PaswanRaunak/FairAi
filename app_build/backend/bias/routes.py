"""
FairLens AI — Bias Analysis Routes
API endpoints for model training and bias analysis.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth.dependencies import get_current_user, CurrentUser
from datasets.routes import get_stored_dataset
from bias.model_trainer import train_model
from bias.engine import run_bias_analysis

router = APIRouter(prefix="/api/bias", tags=["Bias Analysis"])


class TrainModelRequest(BaseModel):
    datasetId: str
    targetColumn: str
    sensitiveAttributes: list[str]
    modelType: str = "logistic_regression"


class AnalyzeRequest(BaseModel):
    modelId: str


@router.post("/train-model")
async def train(req: TrainModelRequest, user: CurrentUser = Depends(get_current_user)):
    """Train a model on the uploaded dataset."""
    try:
        data = get_stored_dataset(req.datasetId)
        result = train_model(
            df=data["df"],
            target_column=req.targetColumn,
            sensitive_attributes=req.sensitiveAttributes,
            model_type=req.modelType,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.post("/analyze")
async def analyze(req: AnalyzeRequest, user: CurrentUser = Depends(get_current_user)):
    """Run bias analysis on a trained model."""
    try:
        result = run_bias_analysis(req.modelId)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
