"""
FairLens AI — Bias Detection Engine
Orchestrates the full bias analysis pipeline using Fairlearn metrics.
"""

import numpy as np
import pandas as pd
from bias.metrics import (
    demographic_parity_difference,
    equal_opportunity_difference,
    disparate_impact_ratio,
    statistical_parity_difference,
    individual_fairness_score,
)
from bias.model_trainer import get_trained_model


def run_bias_analysis(model_id: str) -> dict:
    """
    Run comprehensive bias analysis on a trained model.
    Returns all metrics for each sensitive attribute.
    """
    model_data = get_trained_model(model_id)

    X = model_data["X"]
    y_true = model_data["y"]
    y_pred = model_data["y_pred"]
    df_clean = model_data["df_clean"]
    sensitive_attributes = model_data["sensitive_attributes"]

    results = {
        "modelId": model_id,
        "sensitiveAttributes": sensitive_attributes,
        "metrics": {},
        "overallStats": {
            "totalSamples": len(y_true),
            "positiveRate": round(float(y_true.mean()), 4),
            "predictedPositiveRate": round(float(y_pred.mean()), 4),
        },
    }

    for attr in sensitive_attributes:
        if attr not in df_clean.columns:
            continue

        sensitive_values = df_clean[attr].values.astype(str)

        attr_metrics = {
            "demographicParity": demographic_parity_difference(y_pred, sensitive_values),
            "equalOpportunity": equal_opportunity_difference(y_true, y_pred, sensitive_values),
            "disparateImpact": disparate_impact_ratio(y_pred, sensitive_values),
            "statisticalParity": statistical_parity_difference(y_pred, sensitive_values),
        }

        # Compute bias severity
        dp_val = attr_metrics["demographicParity"]["value"]
        di_val = attr_metrics["disparateImpact"]["value"]

        if dp_val > 0.2 or di_val < 0.6:
            severity = "critical"
        elif dp_val > 0.1 or di_val < 0.8:
            severity = "high"
        elif dp_val > 0.05:
            severity = "medium"
        else:
            severity = "low"

        attr_metrics["severity"] = severity
        attr_metrics["attributeName"] = attr
        attr_metrics["uniqueGroups"] = list(np.unique(sensitive_values))

        # Group-level breakdown
        groups = np.unique(sensitive_values)
        group_breakdown = []
        for g in groups:
            mask = sensitive_values == g
            group_breakdown.append({
                "group": str(g),
                "count": int(mask.sum()),
                "actualPositiveRate": round(float(y_true[mask].mean()), 4),
                "predictedPositiveRate": round(float(y_pred[mask].mean()), 4),
            })
        attr_metrics["groupBreakdown"] = group_breakdown

        results["metrics"][attr] = attr_metrics

    # Individual fairness (attribute-independent)
    try:
        individual = individual_fairness_score(X, y_pred)
        results["individualFairness"] = individual
    except Exception:
        results["individualFairness"] = {"value": None, "error": "Could not compute"}

    # Overall bias score (average severity across attributes)
    severity_scores = {"low": 1, "medium": 2, "high": 3, "critical": 4}
    severities = [
        severity_scores.get(results["metrics"][attr]["severity"], 0)
        for attr in results["metrics"]
    ]
    avg_severity = sum(severities) / len(severities) if severities else 0

    if avg_severity >= 3.5:
        results["overallBiasLevel"] = "critical"
    elif avg_severity >= 2.5:
        results["overallBiasLevel"] = "high"
    elif avg_severity >= 1.5:
        results["overallBiasLevel"] = "medium"
    else:
        results["overallBiasLevel"] = "low"

    results["overallBiasScore"] = round(avg_severity / 4, 2)

    return results
