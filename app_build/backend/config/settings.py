"""
FairLens AI — Application Settings
Loads configuration from environment variables.
"""

import os
from dotenv import load_dotenv

# Load backend .env relative to this settings file to ensure values are available
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(env_path, override=True)


class Settings:
    """Application configuration loaded from environment variables."""

    # LLM Provider: "gemini" or "groq" (defaults to groq if GROQ key is set)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "auto")

    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Groq Cloud
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    # Firebase
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")

    # CORS
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
        ).split(",")
    ]

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Upload limits
    MAX_UPLOAD_SIZE_MB: int = 50
    MAX_DATASET_ROWS: int = 100_000
    SHAP_SAMPLE_SIZE: int = 1000

    # Temp directory for uploads
    TEMP_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp_uploads")


settings = Settings()

# Ensure temp dir exists
os.makedirs(settings.TEMP_DIR, exist_ok=True)
