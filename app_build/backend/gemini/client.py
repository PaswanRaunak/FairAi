"""
FairLens AI — LLM Client (Multi-Provider)
Supports Google Gemini and Groq Cloud APIs.
The active provider is selected via the LLM_PROVIDER env var.
"""

import asyncio
import google.generativeai as genai
from groq import Groq
from config.settings import settings


# ── Provider state ──────────────────────────────────────────────────
_gemini_model = None
_groq_client = None
_active_provider = None   # "gemini" | "groq" | None


def _resolve_provider() -> str | None:
    """Determine which LLM provider to use based on config."""
    pref = settings.LLM_PROVIDER.lower().strip()

    if pref == "groq":
        if settings.GROQ_API_KEY:
            return "groq"
        print("[WARN] LLM_PROVIDER=groq but GROQ_API_KEY is empty. Falling back.")
    elif pref == "gemini":
        if settings.GEMINI_API_KEY:
            return "gemini"
        print("[WARN] LLM_PROVIDER=gemini but GEMINI_API_KEY is empty. Falling back.")
    elif pref == "auto":
        # Auto: prefer Groq (faster), then Gemini
        if settings.GROQ_API_KEY:
            return "groq"
        if settings.GEMINI_API_KEY:
            return "gemini"

    # Last-resort fallback: try whichever key is set
    if settings.GROQ_API_KEY:
        return "groq"
    if settings.GEMINI_API_KEY:
        return "gemini"
    return None


# ── Initialization ──────────────────────────────────────────────────
def init_gemini():
    """Initialize the active LLM provider (called at app startup)."""
    global _gemini_model, _groq_client, _active_provider

    _active_provider = _resolve_provider()

    if _active_provider == "groq":
        try:
            _groq_client = Groq(api_key=settings.GROQ_API_KEY)
            print(f"[INFO] Groq Cloud API initialized with model: {settings.GROQ_MODEL}")
        except Exception as e:
            print(f"[ERROR] Failed to initialize Groq: {e}")
            _active_provider = None

    elif _active_provider == "gemini":
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            _gemini_model = genai.GenerativeModel("gemini-2.0-flash")
            print("[INFO] Gemini API initialized with gemini-2.0-flash model.")
        except Exception as e:
            print(f"[ERROR] Failed to initialize Gemini: {e}")
            _active_provider = None

    else:
        print("[WARN] No LLM API key configured. AI features will return fallback responses.")


def get_active_provider() -> str | None:
    """Return the name of the currently active LLM provider."""
    return _active_provider


# ── Generation ──────────────────────────────────────────────────────
def _sync_generate_gemini(prompt: str) -> str:
    """Synchronous Gemini call (runs in thread pool)."""
    response = _gemini_model.generate_content(prompt)
    return response.text


def _sync_generate_groq(prompt: str) -> str:
    """Synchronous Groq call (runs in thread pool)."""
    chat_completion = _groq_client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a fairness and AI ethics expert working for FairLens AI, "
                    "an enterprise-grade bias auditing platform. Always respond with "
                    "well-structured Markdown."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        model=settings.GROQ_MODEL,
        temperature=0.6,
        max_tokens=2048,
    )
    return chat_completion.choices[0].message.content


async def generate_response(prompt: str) -> str:
    """
    Generate a response from the active LLM provider.
    Runs the synchronous SDK call in a thread pool to avoid blocking the event loop.
    Returns fallback text if no provider is configured.
    """
    if _active_provider == "groq" and _groq_client:
        try:
            result = await asyncio.to_thread(_sync_generate_groq, prompt)
            return result
        except Exception as e:
            print(f"[ERROR] Groq API call failed: {e}")
            return _get_fallback_response(prompt)

    elif _active_provider == "gemini" and _gemini_model:
        try:
            result = await asyncio.to_thread(_sync_generate_gemini, prompt)
            return result
        except Exception as e:
            print(f"[ERROR] Gemini API call failed: {e}")
            return _get_fallback_response(prompt)

    return _get_fallback_response(prompt)


# ── Fallback ────────────────────────────────────────────────────────
def _get_fallback_response(prompt: str) -> str:
    """Return a helpful fallback when no LLM provider is available."""
    if "mitigation" in prompt.lower() or "recommend" in prompt.lower():
        return """## Bias Mitigation Recommendations (Demo Mode)

> ⚠️ **Note**: Configure your `GROQ_API_KEY` or `GEMINI_API_KEY` in the `.env` file to get AI-powered analysis.

### Data-Level Interventions
- **Rebalance dataset** — Ensure equal representation across groups using oversampling (SMOTE) or undersampling
- **Audit data collection** — Review data sources for systematic biases in sampling

### Model-Level Interventions
- **Use fairness constraints** — Apply Fairlearn's `ExponentiatedGradient` or `GridSearch` with appropriate fairness constraints
- **Try alternative algorithms** — Test models less prone to perpetuating historical bias

### Post-Processing Interventions
- **Adjust decision thresholds** — Use group-specific thresholds to equalize outcomes
- **Apply calibration** — Ensure predicted probabilities are well-calibrated across groups

### Organizational Recommendations
- **Establish a fairness review board** — Regular audits of AI decisions
- **Implement monitoring** — Track fairness metrics in production over time
- **Document decisions** — Maintain records of fairness trade-offs made"""

    elif "executive" in prompt.lower() or "compliance" in prompt.lower():
        return """## Executive Summary (Demo Mode)

> ⚠️ **Note**: Configure your `GROQ_API_KEY` or `GEMINI_API_KEY` for AI-generated compliance summaries.

🔴 **RISK ASSESSMENT**: The audited AI system shows measurable bias across one or more protected attributes.

### Key Findings
- Disparate treatment detected across demographic groups
- Outcome rates vary significantly by protected characteristics
- Current model may not meet regulatory fairness standards

### Compliance Implications
- Potential violations of anti-discrimination regulations
- May require remediation before deployment in regulated domains
- Documentation of bias assessment is recommended for audit trails

### Recommended Next Steps
1. Review the detailed bias metrics in the full audit report
2. Implement suggested mitigation strategies
3. Re-audit after implementing changes
4. Establish ongoing monitoring protocols"""

    else:
        return """## Bias Analysis Summary (Demo Mode)

> ⚠️ **Note**: Configure your `GROQ_API_KEY` or `GEMINI_API_KEY` in the `.env` file to unlock AI-powered explanations.

### What Was Detected
The bias analysis identified measurable differences in how the AI model treats different demographic groups. Some groups receive favorable outcomes at higher rates than others.

### Why This Matters
When AI systems make decisions that disproportionately affect certain groups, it can perpetuate historical inequalities and lead to unfair outcomes in hiring, lending, admissions, and other critical domains.

### What You Can Do
1. Review the detailed metrics in the Audit Results tab
2. Explore feature importance in the Explainability tab
3. Test different thresholds in the Simulation Lab
4. Generate a full compliance report for your team"""
