"""
FairLens AI — FastAPI Application Entry Point
Enterprise-grade AI Fairness Auditing Platform
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config.settings import settings
from config.firebase_admin import init_firebase
from gemini.client import init_gemini, get_active_provider
from datasets.demo_data import save_demo_datasets

from auth.routes import router as auth_router
from datasets.routes import router as datasets_router
from bias.routes import router as bias_router
from gemini.routes import router as gemini_router
from explainability.routes import router as explain_router
from simulation.routes import router as simulation_router
from reports.routes import router as reports_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    print("=" * 60)
    print("  FairLens AI — Starting up...")
    print("=" * 60)

    # Initialize Firebase
    init_firebase()

    # Initialize Gemini
    init_gemini()

    # Generate demo datasets
    try:
        counts = save_demo_datasets()
        print(f"[INFO] Demo datasets generated: {counts}")
    except Exception as e:
        print(f"[WARN] Could not generate demo datasets: {e}")

    print("[INFO] FairLens AI is ready!")
    print(f"[INFO] API docs available at: http://localhost:{settings.PORT}/docs")
    print("=" * 60)

    yield

    # Shutdown
    print("[INFO] FairLens AI shutting down...")


app = FastAPI(
    title="FairLens AI",
    description="Enterprise-grade AI Fairness Auditing Platform — Detect, explain, and mitigate bias in automated decisions.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Register routers
app.include_router(auth_router)
app.include_router(datasets_router)
app.include_router(bias_router)
app.include_router(gemini_router)
app.include_router(explain_router)
app.include_router(simulation_router)
app.include_router(reports_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "name": "FairLens AI",
        "version": "1.0.0",
        "status": "running",
        "description": "AI Fairness Auditing Platform",
    }


@app.get("/api/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "llmProvider": get_active_provider() or "none",
        "geminiConfigured": bool(settings.GEMINI_API_KEY),
        "groqConfigured": bool(settings.GROQ_API_KEY),
        "firebaseConfigured": bool(settings.FIREBASE_PROJECT_ID),
    }
