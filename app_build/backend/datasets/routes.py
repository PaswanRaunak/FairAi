"""
FairLens AI — Dataset Routes
Handles dataset upload, preview, and demo data loading.
"""

import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request
from auth.dependencies import get_current_user, CurrentUser
from datasets.parser import parse_dataset, get_dataset_preview, detect_target_columns
from datasets.sensitive_detector import detect_sensitive_attributes
from datasets.demo_data import load_demo_dataset, DEMO_DATASET_INFO
from config.settings import settings

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])

# In-memory store for loaded datasets (session-scoped)
_loaded_datasets: dict[str, dict] = {}


def store_dataset(df, name: str, uid: str) -> str:
    """Store a dataset in memory, scoped to the user's uid."""
    dataset_id = uuid.uuid4().hex[:12]
    scoped_key = f"{uid}:{dataset_id}"
    _loaded_datasets[scoped_key] = {
        "df": df,
        "name": name,
        "owner_uid": uid,
    }
    return dataset_id


def get_stored_dataset(dataset_id: str, uid: str):
    """Retrieve a stored dataset by ID, validating ownership."""
    scoped_key = f"{uid}:{dataset_id}"
    data = _loaded_datasets.get(scoped_key)
    if not data:
        raise HTTPException(status_code=404, detail="Dataset not found. Please upload or load a dataset.")
    return data


@router.post("/upload")
async def upload_dataset(
    request: Request,
    file: UploadFile = File(...),
    user: CurrentUser = Depends(get_current_user),
):
    """Upload a CSV or Excel file for analysis."""
    # Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in (".csv", ".xlsx", ".xls"):
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV or Excel.")

    # Enforce upload size BEFORE writing to disk
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum upload size is {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )

    # Stream to temp with byte-counting guard
    temp_path = os.path.join(settings.TEMP_DIR, f"{uuid.uuid4().hex}{ext}")
    try:
        bytes_written = 0
        with open(temp_path, "wb") as f:
            while chunk := await file.read(1024 * 256):  # 256 KB chunks
                bytes_written += len(chunk)
                if bytes_written > max_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File too large. Maximum upload size is {settings.MAX_UPLOAD_SIZE_MB} MB.",
                    )
                f.write(chunk)

        # Parse
        df = parse_dataset(temp_path)

        if len(df) > settings.MAX_DATASET_ROWS:
            raise HTTPException(
                status_code=400,
                detail=f"Dataset too large. Maximum {settings.MAX_DATASET_ROWS:,} rows allowed.",
            )

        # Store in memory (scoped to user)
        dataset_id = store_dataset(df, file.filename or "uploaded_dataset", uid=user.uid)

        # Generate preview
        preview = get_dataset_preview(df)
        sensitive = detect_sensitive_attributes(list(df.columns))
        targets = detect_target_columns(df)

        return {
            "datasetId": dataset_id,
            "name": file.filename,
            "preview": preview,
            "sensitiveAttributes": sensitive,
            "suggestedTargets": targets,
        }

    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.get("/demo")
async def list_demo_datasets():
    """List available demo datasets."""
    return {"datasets": DEMO_DATASET_INFO}


@router.get("/demo/{name}")
async def load_demo(name: str, user: CurrentUser = Depends(get_current_user)):
    """Load a demo dataset by name."""
    if name not in DEMO_DATASET_INFO:
        raise HTTPException(
            status_code=404,
            detail=f"Demo dataset '{name}' not found. Available: {list(DEMO_DATASET_INFO.keys())}",
        )

    df = load_demo_dataset(name)
    dataset_id = store_dataset(df, DEMO_DATASET_INFO[name]["name"], uid=user.uid)
    preview = get_dataset_preview(df)
    sensitive = detect_sensitive_attributes(list(df.columns))
    targets = detect_target_columns(df)

    return {
        "datasetId": dataset_id,
        "name": DEMO_DATASET_INFO[name]["name"],
        "info": DEMO_DATASET_INFO[name],
        "preview": preview,
        "sensitiveAttributes": sensitive,
        "suggestedTargets": targets,
    }


@router.get("/{dataset_id}/preview")
async def get_preview(dataset_id: str, user: CurrentUser = Depends(get_current_user)):
    """Get preview of a loaded dataset."""
    data = get_stored_dataset(dataset_id, uid=user.uid)
    preview = get_dataset_preview(data["df"])
    return {"datasetId": dataset_id, "name": data["name"], "preview": preview}


@router.get("/{dataset_id}/sensitive")
async def get_sensitive(dataset_id: str, user: CurrentUser = Depends(get_current_user)):
    """Get auto-detected sensitive attributes for a dataset."""
    data = get_stored_dataset(dataset_id, uid=user.uid)
    sensitive = detect_sensitive_attributes(list(data["df"].columns))
    targets = detect_target_columns(data["df"])
    return {
        "datasetId": dataset_id,
        "sensitiveAttributes": sensitive,
        "suggestedTargets": targets,
    }
