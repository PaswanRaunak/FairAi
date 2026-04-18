"""
FairLens AI — Gemini Prompt Templates
Structured prompts for bias explanation, mitigation, and executive summaries.
"""


def bias_explanation_prompt(dataset_name: str, target_column: str, sensitive_attrs: list, metrics: dict) -> str:
    """Generate prompt for explaining detected bias in plain English."""
    return f"""You are a fairness and AI ethics expert. Analyze the following AI bias audit results and explain the findings in plain English for a non-technical audience.

**Dataset**: {dataset_name}
**Target Variable**: {target_column} (the decision being made)
**Sensitive Attributes Analyzed**: {', '.join(sensitive_attrs)}

**Bias Metrics Results**:
{_format_metrics(metrics)}

Please provide a structured analysis:

1. **Summary**: What bias was detected? (2-3 sentences)
2. **Affected Groups**: Which groups are disadvantaged? How severely?
3. **Severity Assessment**: Rate the overall bias as Low/Medium/High/Critical and explain why
4. **Real-World Impact**: What does this bias mean for people affected by these decisions?
5. **Key Concern**: What is the single most important finding that decision-makers should know?

Use clear, accessible language. Avoid jargon. Use specific numbers from the metrics."""


def mitigation_prompt(dataset_name: str, metrics: dict) -> str:
    """Generate prompt for bias mitigation recommendations."""
    return f"""Based on the following bias audit results for the "{dataset_name}" dataset, recommend specific, actionable strategies to improve fairness.

**Bias Audit Results**:
{_format_metrics(metrics)}

Provide recommendations organized into these categories:

**1. Data-Level Interventions**
- Specific resampling or augmentation techniques
- Data collection improvements

**2. Model-Level Interventions**
- Algorithm adjustments or alternatives
- Regularization approaches
- Fairness-aware training methods

**3. Post-Processing Interventions**
- Threshold tuning recommendations (with specific groups)
- Calibration approaches

**4. Organizational Recommendations**
- Process changes
- Governance frameworks
- Monitoring strategies

For each recommendation, provide:
- What to do (specific action)
- Expected impact on fairness metrics
- Implementation difficulty (Easy/Medium/Hard)
- Priority (P0/P1/P2)

Be specific and practical. Reference the actual metrics and groups in your recommendations."""


def executive_summary_prompt(dataset_name: str, target_column: str, metrics: dict) -> str:
    """Generate prompt for executive/compliance summary."""
    import json
    return f"""You are Google Gemini AI, acting as an expert AI fairness auditor.

You are given bias metrics from a machine learning model. Even if some values are approximate or limited, you MUST still generate a complete executive summary.

Bias Metrics:
{json.dumps(metrics, indent=2)}

Instructions:
- Do NOT ask for more data
- Assume the data is sufficient
- Always generate a confident answer

Your task:
1. Identify if bias exists
2. Mention which group is affected
3. Explain real-world impact
4. Suggest one strong improvement

Format strictly:

Executive Summary:
...

Risk:
...

Recommendation:
..."""


def _format_metrics(metrics: dict) -> str:
    """Format metrics dict into readable text for the prompt."""
    lines = []
    for attr, data in metrics.items():
        if isinstance(data, dict):
            lines.append(f"\n--- {attr} ---")
            for key, value in data.items():
                if isinstance(value, dict):
                    lines.append(f"  {key}:")
                    for k, v in value.items():
                        lines.append(f"    {k}: {v}")
                elif isinstance(value, list):
                    lines.append(f"  {key}: {value}")
                else:
                    lines.append(f"  {key}: {value}")
        else:
            lines.append(f"{attr}: {data}")
    return "\n".join(lines)
