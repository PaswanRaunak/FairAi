"""
FairLens AI — Model Trainer
Trains a lightweight classifier on uploaded data for bias analysis.
"""

import uuid

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

# In-memory model store
_trained_models: dict[str, dict] = {}


def prepare_features(df: pd.DataFrame, target_column: str, sensitive_attributes: list[str]):
    """
    Prepare features for training.
    Encodes categorical columns, scales numerical ones.
    Returns X, y, feature_names, encoders, scaler.
    """
    df_clean = df.dropna(subset=[target_column]).copy()

    # Validate that the target column is binary
    unique_values = df_clean[target_column].nunique()
    if unique_values != 2:
        raise ValueError(
            f"Target column '{target_column}' must be binary (exactly 2 unique values), "
            f"but found {unique_values}. Please choose a different target column."
        )

    y = df_clean[target_column].values.astype(int)

    # Feature columns = all except target and ID-like columns
    feature_cols = [
        col for col in df_clean.columns
        if col != target_column and not col.lower().endswith("_id") and col.lower() != "id"
    ]

    encoders = {}
    X_parts = []
    feature_names = []

    for col in feature_cols:
        if pd.api.types.is_numeric_dtype(df_clean[col]):
            X_parts.append(df_clean[col].fillna(0).values.reshape(-1, 1))
            feature_names.append(col)
        else:
            le = LabelEncoder()
            encoded = le.fit_transform(df_clean[col].fillna("unknown").astype(str))
            X_parts.append(encoded.reshape(-1, 1))
            feature_names.append(col)
            encoders[col] = le

    if not X_parts:
        raise ValueError("No usable feature columns found.")

    X = np.hstack(X_parts)

    # Scale
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, y, feature_names, encoders, scaler, df_clean


def train_model(
    df: pd.DataFrame,
    target_column: str,
    sensitive_attributes: list[str],
    model_type: str = "logistic_regression",
    uid: str = "",
) -> dict:
    """
    Train a model and return results.
    """
    X, y, feature_names, encoders, scaler, df_clean = prepare_features(
        df, target_column, sensitive_attributes
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    if model_type == "random_forest":
        model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
    else:
        model = LogisticRegression(max_iter=1000, random_state=42)

    model.fit(X_train, y_train)

    y_pred_train = model.predict(X_train)
    y_pred_test = model.predict(X_test)
    y_pred_all = model.predict(X)

    train_acc = accuracy_score(y_train, y_pred_train)
    test_acc = accuracy_score(y_test, y_pred_test)

    # Store model in memory, scoped to the user's uid
    model_id = f"model_{uuid.uuid4().hex[:12]}"
    scoped_key = f"{uid}:{model_id}"
    _trained_models[scoped_key] = {
        "model": model,
        "scaler": scaler,
        "encoders": encoders,
        "feature_names": feature_names,
        "X": X,
        "y": y,
        "y_pred": y_pred_all,
        "df_clean": df_clean,
        "target_column": target_column,
        "sensitive_attributes": sensitive_attributes,
        "owner_uid": uid,
    }

    return {
        "modelId": model_id,
        "modelType": model_type,
        "trainAccuracy": round(train_acc, 4),
        "testAccuracy": round(test_acc, 4),
        "featureNames": feature_names,
        "trainSize": len(X_train),
        "testSize": len(X_test),
    }


def get_trained_model(model_id: str, uid: str = "") -> dict:
    """Retrieve a trained model by ID, validating ownership."""
    scoped_key = f"{uid}:{model_id}"
    if scoped_key not in _trained_models:
        raise ValueError(f"Model {model_id} not found. Please train a model first.")
    return _trained_models[scoped_key]
