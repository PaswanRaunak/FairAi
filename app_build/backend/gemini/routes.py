"""
FairLens AI — Gemini Routes
API endpoints for AI-powered bias explanation and mitigation advice.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from auth.dependencies import get_current_user, CurrentUser
from gemini.client import generate_response
from gemini.prompts import bias_explanation_prompt, mitigation_prompt, executive_summary_prompt
from bias.model_trainer import get_trained_model
from bias.engine import run_bias_analysis

router = APIRouter(prefix="/api/gemini", tags=["Gemini AI"])


class ExplainRequest(BaseModel):
    modelId: str
    datasetName: str = "Uploaded Dataset"


class MitigateRequest(BaseModel):
    modelId: str
    datasetName: str = "Uploaded Dataset"


class ExecutiveSummaryRequest(BaseModel):
    modelId: str
    datasetName: str = "Uploaded Dataset"


@router.post("/explain")
async def explain_bias(req: ExplainRequest, user: CurrentUser = Depends(get_current_user)):
    """Get plain-English explanation of detected bias using Gemini."""
    try:
        model_data = get_trained_model(req.modelId)
        bias_results = run_bias_analysis(req.modelId)

        prompt = bias_explanation_prompt(
            dataset_name=req.datasetName,
            target_column=model_data["target_column"],
            sensitive_attrs=model_data["sensitive_attributes"],
            metrics=bias_results["metrics"],
        )

        explanation = await generate_response(prompt)
        return {
            "explanation": explanation,
            "modelId": req.modelId,
            "source": "gemini",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation failed: {str(e)}")


@router.post("/mitigate")
async def get_mitigation(req: MitigateRequest, user: CurrentUser = Depends(get_current_user)):
    """Get AI-powered mitigation recommendations."""
    try:
        bias_results = run_bias_analysis(req.modelId)

        prompt = mitigation_prompt(
            dataset_name=req.datasetName,
            metrics=bias_results["metrics"],
        )

        advice = await generate_response(prompt)
        return {
            "recommendations": advice,
            "modelId": req.modelId,
            "source": "gemini",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mitigation failed: {str(e)}")


@router.post("/executive-summary")
async def get_executive_summary(
    req: ExecutiveSummaryRequest, user: CurrentUser = Depends(get_current_user)
):
    """Get executive-friendly compliance summary."""
    try:
        model_data = get_trained_model(req.modelId)
        bias_results = run_bias_analysis(req.modelId)

        prompt = executive_summary_prompt(
            dataset_name=req.datasetName,
            target_column=model_data["target_column"],
            metrics=bias_results["metrics"],
        )

        summary = await generate_response(prompt)
        return {
            "summary": summary,
            "modelId": req.modelId,
            "source": "gemini",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary failed: {str(e)}")
