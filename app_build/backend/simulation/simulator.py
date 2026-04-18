"""
FairLens AI — Threshold Simulator
Simulates the effect of adjusting classification thresholds on fairness metrics.
"""

import numpy as np
from bias.model_trainer import get_trained_model
from bias.metrics import (
    demographic_parity_difference,
    equal_opportunity_difference,
    disparate_impact_ratio,
)


def simulate_threshold(
    model_id: str,
    sensitive_attribute: str,
    thresholds: dict[str, float],
) -> dict:
    """
    Simulate the effect of group-specific thresholds on fairness metrics.

    Args:
        model_id: ID of the trained model
        sensitive_attribute: The sensitive attribute to simulate on
        thresholds: Dict mapping group names to threshold values (0-1)
    """
    model_data = get_trained_model(model_id)
    model = model_data["model"]
    X = model_data["X"]
    y_true = model_data["y"]
    df_clean = model_data["df_clean"]

    if sensitive_attribute not in df_clean.columns:
        raise ValueError(f"Attribute '{sensitive_attribute}' not found in dataset.")

    sensitive_values = df_clean[sensitive_attribute].values.astype(str)

    # Get prediction probabilities
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)[:, 1]
    else:
        proba = model.predict(X).astype(float)

    # Default predictions (threshold = 0.5)
    default_preds = (proba >= 0.5).astype(int)

    # Custom threshold predictions
    custom_preds = np.zeros(len(proba), dtype=int)
    groups = np.unique(sensitive_values)

    for g in groups:
        mask = sensitive_values == g
        threshold = thresholds.get(str(g), 0.5)
        custom_preds[mask] = (proba[mask] >= threshold).astype(int)

    # Compute before/after metrics
    before = {
        "demographicParity": demographic_parity_difference(default_preds, sensitive_values),
        "equalOpportunity": equal_opportunity_difference(y_true, default_preds, sensitive_values),
        "disparateImpact": disparate_impact_ratio(default_preds, sensitive_values),
        "positiveRate": round(float(default_preds.mean()), 4),
    }

    after = {
        "demographicParity": demographic_parity_difference(custom_preds, sensitive_values),
        "equalOpportunity": equal_opportunity_difference(y_true, custom_preds, sensitive_values),
        "disparateImpact": disparate_impact_ratio(custom_preds, sensitive_values),
        "positiveRate": round(float(custom_preds.mean()), 4),
    }

    # Per-group comparison
    group_comparison = []
    for g in groups:
        mask = sensitive_values == g
        group_comparison.append({
            "group": str(g),
            "count": int(mask.sum()),
            "threshold": thresholds.get(str(g), 0.5),
            "beforeRate": round(float(default_preds[mask].mean()), 4),
            "afterRate": round(float(custom_preds[mask].mean()), 4),
            "change": round(float(custom_preds[mask].mean() - default_preds[mask].mean()), 4),
        })

    return {
        "sensitiveAttribute": sensitive_attribute,
        "thresholds": thresholds,
        "before": before,
        "after": after,
        "groupComparison": group_comparison,
        "improvement": {
            "demographicParity": round(
                before["demographicParity"]["value"] - after["demographicParity"]["value"], 4
            ),
            "disparateImpact": round(
                after["disparateImpact"]["value"] - before["disparateImpact"]["value"], 4
            ),
        },
    }
