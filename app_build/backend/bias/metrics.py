"""
FairLens AI — Bias Metrics Calculator
Computes individual fairness metrics.
"""

import numpy as np
from sklearn.metrics import confusion_matrix


def demographic_parity_difference(y_pred: np.ndarray, sensitive: np.ndarray) -> dict:
    """
    Compute Demographic Parity Difference.
    Measures the difference in positive prediction rates between groups.
    Ideal value: 0 (equal rates across all groups).
    """
    groups = np.unique(sensitive)
    rates = {}
    for g in groups:
        mask = sensitive == g
        if mask.sum() == 0:
            continue
        rates[str(g)] = float(y_pred[mask].mean())

    if not rates:
        return {"value": 0, "groupRates": {}, "maxDiff": 0}

    values = list(rates.values())
    max_diff = max(values) - min(values)

    return {
        "value": round(max_diff, 4),
        "groupRates": {k: round(v, 4) for k, v in rates.items()},
        "maxDiff": round(max_diff, 4),
    }


def equal_opportunity_difference(
    y_true: np.ndarray, y_pred: np.ndarray, sensitive: np.ndarray
) -> dict:
    """
    Compute Equal Opportunity Difference.
    Measures the difference in true positive rates between groups.
    Ideal value: 0.
    """
    groups = np.unique(sensitive)
    tpr = {}
    for g in groups:
        mask = sensitive == g
        y_t = y_true[mask]
        y_p = y_pred[mask]
        positives = y_t == 1
        if positives.sum() == 0:
            continue
        tpr[str(g)] = float(y_p[positives].mean())

    if not tpr:
        return {"value": 0, "groupTPR": {}, "maxDiff": 0}

    values = list(tpr.values())
    max_diff = max(values) - min(values)

    return {
        "value": round(max_diff, 4),
        "groupTPR": {k: round(v, 4) for k, v in tpr.items()},
        "maxDiff": round(max_diff, 4),
    }


def disparate_impact_ratio(y_pred: np.ndarray, sensitive: np.ndarray) -> dict:
    """
    Compute Disparate Impact Ratio.
    Ratio of positive prediction rates between least and most favored group.
    Ideal value: 1.0. Legal threshold often at 0.8 (80% rule).
    """
    groups = np.unique(sensitive)
    rates = {}
    for g in groups:
        mask = sensitive == g
        if mask.sum() == 0:
            continue
        rates[str(g)] = float(y_pred[mask].mean())

    if not rates or max(rates.values()) == 0:
        return {"value": 1.0, "groupRates": {}, "ratio": 1.0}

    min_rate = min(rates.values())
    max_rate = max(rates.values())
    ratio = min_rate / max_rate if max_rate > 0 else 1.0

    return {
        "value": round(ratio, 4),
        "groupRates": {k: round(v, 4) for k, v in rates.items()},
        "ratio": round(ratio, 4),
        "passesThreshold": ratio >= 0.8,
    }


def statistical_parity_difference(y_pred: np.ndarray, sensitive: np.ndarray) -> dict:
    """
    Compute Statistical Parity Difference.
    Maximum difference in selection rates between any group and the overall rate.
    Ideal value: 0.
    """
    overall_rate = float(y_pred.mean())
    groups = np.unique(sensitive)
    diffs = {}
    for g in groups:
        mask = sensitive == g
        if mask.sum() == 0:
            continue
        group_rate = float(y_pred[mask].mean())
        diffs[str(g)] = group_rate - overall_rate

    max_diff = max(abs(v) for v in diffs.values()) if diffs else 0

    return {
        "value": round(max_diff, 4),
        "overallRate": round(overall_rate, 4),
        "groupDiffs": {k: round(v, 4) for k, v in diffs.items()},
    }


def individual_fairness_score(
    X: np.ndarray, y_pred: np.ndarray, n_neighbors: int = 10
) -> dict:
    """
    Compute Individual Fairness Score (consistency).
    Measures whether similar individuals receive similar predictions.
    Score 0-1, where 1 = perfectly consistent.
    """
    from sklearn.neighbors import NearestNeighbors

    n_samples = min(len(X), 1000)  # Limit for performance
    if n_samples < n_neighbors + 1:
        return {"value": 1.0, "consistency": 1.0, "sampleSize": n_samples}

    # Sample if too large
    idx = np.random.choice(len(X), n_samples, replace=False)
    X_sample = X[idx]
    y_sample = y_pred[idx]

    nn = NearestNeighbors(n_neighbors=n_neighbors, metric="euclidean")
    nn.fit(X_sample)
    _, indices = nn.kneighbors(X_sample)

    consistency = 0
    for i in range(n_samples):
        neighbor_preds = y_sample[indices[i]]
        consistency += 1 - abs(y_sample[i] - neighbor_preds.mean())

    score = consistency / n_samples

    return {
        "value": round(float(score), 4),
        "consistency": round(float(score), 4),
        "sampleSize": n_samples,
    }
