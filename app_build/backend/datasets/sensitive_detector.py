"""
FairLens AI — Sensitive Attribute Detector
Auto-detects columns that may represent sensitive/protected attributes.
"""

# Dictionary of sensitive attribute keywords (lowercase)
SENSITIVE_KEYWORDS = [
    "gender", "sex", "male", "female",
    "race", "ethnicity", "ethnic",
    "age", "age_group", "age_range",
    "caste", "caste_category",
    "religion", "religious",
    "location", "region", "state", "country", "city", "zip", "zipcode", "zip_code",
    "income", "salary", "wage", "family_income",
    "disability", "disabled",
    "marital", "marital_status", "married",
    "nationality", "national_origin",
    "language", "native_language",
    "veteran", "veteran_status",
    "pregnancy", "pregnant",
    "orientation", "sexual_orientation",
]


def detect_sensitive_attributes(column_names: list[str]) -> list[dict]:
    """
    Detect potentially sensitive attributes from column names.

    Returns a list of dicts with:
        - name: column name
        - matchedKeyword: the keyword that matched
        - confidence: 'high' or 'medium'
    """
    detected = []

    for col in column_names:
        col_lower = col.lower().strip().replace(" ", "_")

        for keyword in SENSITIVE_KEYWORDS:
            if keyword == col_lower:
                detected.append({
                    "name": col,
                    "matchedKeyword": keyword,
                    "confidence": "high",
                })
                break
            elif keyword in col_lower:
                detected.append({
                    "name": col,
                    "matchedKeyword": keyword,
                    "confidence": "medium",
                })
                break

    return detected
