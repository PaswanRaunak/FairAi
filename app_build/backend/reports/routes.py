"""
FairLens AI — Report Routes
API endpoints for PDF report generation.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from auth.dependencies import get_current_user, CurrentUser
from bias.model_trainer import get_trained_model
from bias.engine import run_bias_analysis
from gemini.client import generate_response
from gemini.prompts import executive_summary_prompt, mitigation_prompt
from reports.pdf_generator import generate_audit_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])


class ReportRequest(BaseModel):
    modelId: str
    datasetName: str = "Uploaded Dataset"
    includeGemini: bool = True


@router.post("/generate")
async def generate_report(req: ReportRequest, user: CurrentUser = Depends(get_current_user)):
    """Generate a comprehensive PDF audit report."""
    try:
        model_data = get_trained_model(req.modelId)
        bias_results = run_bias_analysis(req.modelId)

        gemini_summary = ""
        gemini_mitigation = ""

        if req.includeGemini:
            try:
                summary_prompt = executive_summary_prompt(
                    req.datasetName,
                    model_data["target_column"],
                    bias_results["metrics"],
                )
                gemini_summary = await generate_response(summary_prompt)

                mit_prompt = mitigation_prompt(req.datasetName, bias_results["metrics"])
                gemini_mitigation = await generate_response(mit_prompt)
            except Exception as e:
                print(f"[WARN] Gemini generation for report failed: {e}")

        pdf_bytes = generate_audit_report(
            dataset_name=req.datasetName,
            target_column=model_data["target_column"],
            bias_results=bias_results,
            gemini_summary=gemini_summary,
            gemini_mitigation=gemini_mitigation,
        )

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="FairLens_Audit_{req.datasetName.replace(" ", "_")}.pdf"'
            },
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")
