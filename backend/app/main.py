"""
Shelf Life Estimator — FastAPI Application
============================================
Main entry point for the Fruit Shelf Life Estimator backend.

Run with:
    uvicorn app.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager
import asyncio
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db, async_session
from app.seed_data import seed_database
from app.schemas.schemas import HealthResponse
from app.services.scan_service import classifier_available
from app.routers import fruits, scan, inventory, auth, notifications

# Windows consoles default to cp1252 and crash writing emoji/UTF-8 logs,
# which swallows real tracebacks. Force UTF-8 where the runtime allows it.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass




settings = get_settings()



# ============================================
# Application Lifespan (Startup / Shutdown)
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs on startup and shutdown.

    Startup:
        1. Create database tables
        2. Seed database with 40+ fruits
        3. Create upload directory

    Shutdown:
        - Clean up resources
    """
    # --- Startup ---
    print("[*] Starting Fruit Shelf Life Estimator API...")

    # Create database tables
    await init_db()
    print("[+] Database tables created")

    # Seed database
    async with async_session() as session:
        await seed_database(session)

    # Create upload directory
    upload_dir = settings.upload_dir_path
    upload_dir.mkdir(parents=True, exist_ok=True)
    print(f"[+] Upload directory ready: {upload_dir}")

    # Create models directory (for AI model files)
    models_dir = settings.backend_dir / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    # Preload and warm up the classifier model so first user request is fast
    if not classifier_available():
        print(
            "[!!] AI MODEL NOT DEPLOYED — scanning will return HTTP 503.\n"
            "     Expected artifact: " + str(settings.classifier_model_file) + "\n"
            "     Export it from Freshness44.ipynb and place it in backend/models/."
        )
    else:
        try:
            import numpy as np
            from app.ai.classifier import _get_model
            print("[*] Loading AI classifier model...")
            model = _get_model()
            dummy = np.zeros((1, 224, 224, 3), dtype="float32")
            model.predict(dummy, verbose=0)
            print("[+] AI classifier model ready")
        except Exception as e:
            print(f"[!] AI model preload failed (will retry on first request): {e}")

    print("[OK] Fruit Shelf Life Estimator API is ready!")
    print("[>] API Docs: http://localhost:8000/docs")
    print("[>] ReDoc: http://localhost:8000/redoc")

    # Start background expiry reminder worker
    from app.services.reminder_worker import reminder_worker_loop
    worker_task = asyncio.create_task(reminder_worker_loop(interval_seconds=900))

    try:
        yield  # App is running
    finally:
        # --- Shutdown ---
        print("[*] Shutting down Fruit Shelf Life Estimator API...")
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass
        except Exception:
            pass


# ============================================
# FastAPI Application
# ============================================

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "🍎 **Fruit Shelf Life Estimator API**\n\n"
        "Scan fruits via camera or manual selection, "
        "get AI-powered freshness assessment and shelf life estimates.\n\n"
        "## Features\n"
        "- 📸 **Fruit Scanning** — Upload an image to identify fruit and assess freshness\n"
        "- 🔍 **Fruit Database** — Browse 40+ fruits with shelf life data\n"
        "- 📋 **Inventory Tracking** — Track your fruits and their expiry dates\n"
        "- 🔔 **Expiry Notifications** — Get alerted before fruit goes bad\n"
        "- 💡 **Storage Tips** — Learn how to store fruits properly\n"
        "- 🧪 **Ethylene Compatibility** — Check which fruits can be stored together\n"
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ============================================
# Middleware
# ============================================

# LAN-range CORS regex is only enabled in development (debug=True).
# In production, only the explicit allow_origins list is used.
_cors_kwargs: dict[str, object] = {
    "allow_origins": settings.cors_origins,
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
if settings.debug:
    _cors_kwargs["allow_origin_regex"] = (
        r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$"
    )

app.add_middleware(CORSMiddleware, **_cors_kwargs)  # type: ignore[arg-type]


# ============================================
# Static Files (uploaded images)
# ============================================

# Serve uploaded images at /uploads/filename.jpg
settings.upload_dir_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(settings.upload_dir_path)), name="uploads")


# ============================================
# Include Routers
# ============================================

app.include_router(auth.router)
app.include_router(fruits.router)
app.include_router(scan.router)
app.include_router(inventory.router)
app.include_router(notifications.router)


# ============================================
# Root Endpoints
# ============================================

@app.get(
    "/",
    summary="Root",
    description="API welcome message and quick links.",
)
async def root():
    """Root endpoint with API info."""
    return {
        "message": f"🍎 Welcome to {settings.app_name} API",
        "version": settings.app_version,
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "fruits": "GET /api/fruits/",
            "scan": "POST /api/scan/",
            "inventory": "GET /api/inventory/",
            "compatibility": "GET /api/fruits/compatibility",
        },
    }


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    tags=["System"],
)
async def health_check():
    """Server health check endpoint."""
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        debug=settings.debug,
        ai_scanning="available" if classifier_available() else "unavailable",
    )


