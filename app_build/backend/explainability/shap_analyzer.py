"""
FairLens AI — SHAP Analyzer
Computes SHAP values for model explainability.
"""

import numpy as np
import shap
from bias.model_trainer import get_trained_model
from config.settings import settings


def compute_shap_values(model_id: str) -> dict:
    """
    Compute SHAP values for a trained model.
    Returns feature importance data suitable for visualization.
    """
    model_data = get_trained_model(model_id)
    model = model_data["model"]
    X = model_data["X"]
    feature_names = model_data["feature_names"]

    # Sample for performance
    n_samples = min(len(X), settings.SHAP_SAMPLE_SIZE)
    idx = np.random.RandomState(42).choice(len(X), n_samples, replace=False)
    X_sample = X[idx]

    # Use appropriate SHAP explainer
    try:
        explainer = shap.Explainer(model, X_sample)
        shap_values = explainer(X_sample)

        # Handle multi-output (e.g., RandomForest gives shape (n, features, classes))
        if len(shap_values.values.shape) == 3:
            # Take SHAP values for the positive class (class 1)
            sv = shap_values.values[:, :, 1]
        else:
            sv = shap_values.values

    except Exception:
        # Fallback to KernelExplainer
        try:
            background = shap.sample(X_sample, min(50, len(X_sample)))
            explainer = shap.KernelExplainer(model.predict_proba, background)
            sv = explainer.shap_values(X_sample[:100])
            if isinstance(sv, list):
                sv = sv[1]  # Positive class
        except Exception as e:
            # Last resort: use feature importances if available
            if hasattr(model, "feature_importances_"):
                importances = model.feature_importances_
            elif hasattr(model, "coef_"):
                importances = np.abs(model.coef_[0])
            else:
                importances = np.ones(len(feature_names)) / len(feature_names)

            return {
                "featureImportance": [
                    {"feature": name, "importance": round(float(imp), 4)}
                    for name, imp in sorted(
                        zip(feature_names, importances), key=lambda x: abs(x[1]), reverse=True
                    )
                ],
                "sampleSize": n_samples,
                "method": "fallback_feature_importance",
                "shapValues": None,
            }

    # Compute mean absolute SHAP values (global importance)
    mean_abs_shap = np.abs(sv).mean(axis=0)

    feature_importance = [
        {"feature": name, "importance": round(float(imp), 4)}
        for name, imp in sorted(
            zip(feature_names, mean_abs_shap), key=lambda x: abs(x[1]), reverse=True
        )
    ]

    # Individual SHAP values for force plot (first 10 samples)
    individual_shap = []
    for i in range(min(10, len(sv))):
        individual_shap.append({
            "index": int(idx[i]),
            "values": {
                name: round(float(val), 4)
                for name, val in zip(feature_names, sv[i])
            },
        })

    return {
        "featureImportance": feature_importance,
        "individualShap": individual_shap,
        "sampleSize": n_samples,
        "method": "shap",
    }
