"""
FairLens AI — Dataset Parser
Handles CSV/Excel parsing, preview generation, and column type detection.
"""

import pandas as pd
import numpy as np
import os
from typing import Any


def parse_dataset(file_path: str) -> pd.DataFrame:
    """Parse a CSV or Excel file into a DataFrame."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".csv":
        df = pd.read_csv(file_path)
    elif ext in (".xlsx", ".xls"):
        df = pd.read_excel(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}. Use CSV or Excel.")

    return df


def get_dataset_preview(df: pd.DataFrame, n_rows: int = 10) -> dict[str, Any]:
    """Generate a preview of the dataset including schema and basic stats."""
    columns_info = []
    for col in df.columns:
        col_info = {
            "name": col,
            "dtype": str(df[col].dtype),
            "nullCount": int(df[col].isnull().sum()),
            "uniqueCount": int(df[col].nunique()),
        }

        if pd.api.types.is_numeric_dtype(df[col]):
            col_info["min"] = float(df[col].min()) if not df[col].isnull().all() else None
            col_info["max"] = float(df[col].max()) if not df[col].isnull().all() else None
            col_info["mean"] = round(float(df[col].mean()), 2) if not df[col].isnull().all() else None
        else:
            top_values = df[col].value_counts().head(5).to_dict()
            col_info["topValues"] = {str(k): int(v) for k, v in top_values.items()}

        columns_info.append(col_info)

    # Convert preview rows — handle NaN serialization
    preview_df = df.head(n_rows).copy()
    preview_df = preview_df.replace({np.nan: None})
    preview_rows = preview_df.to_dict(orient="records")

    return {
        "totalRows": len(df),
        "totalColumns": len(df.columns),
        "columns": columns_info,
        "preview": preview_rows,
    }


def detect_target_columns(df: pd.DataFrame) -> list[str]:
    """Detect likely target/label columns (binary 0/1 columns)."""
    candidates = []
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            unique_vals = df[col].dropna().unique()
            if set(unique_vals).issubset({0, 1, 0.0, 1.0}):
                candidates.append(col)
    return candidates
