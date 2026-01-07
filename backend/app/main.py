"""
GlamAI - Main FastAPI Application
Entry point for the backend API
"""
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="fastapi.openapi.utils")
import os
import sys
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from loguru import logger
from sqlalchemy import text

from app.core.config import settings
from app.db.database import async_engine, init_db, close_db
from app.api.v1.endpoints import auth, profile, makeup, vanity, events
from app.api.v1 import api_v1_router


# ============================================================
# LOGGING CONFIGURATION
# ============================================================
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
           "<level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL,
)
logger.add(
    settings.LOG_FILE,
    rotation="500 MB",
    retention="10 days",
    level=settings.LOG_LEVEL,
)

# ============================================================
# LIFESPAN HANDLER (MODERN FASTAPI STARTUP/SHUTDOWN)
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")

    # Ensure logs directory exists
    os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)

    # Try connecting to the database (with retry for Neon wake-up)
    # for attempt in range(3):
    #     try:
    #         async with async_engine.begin() as conn:
    #             result = await conn.execute(text("SELECT current_database()"))
    #             logger.info(f"✅ Connected to database: {result.scalar()}")
    #             break
    #     except Exception as e:
    #         logger.warning(f"⚠️ DB connection attempt {attempt+1} failed: {e}")
    #         await asyncio.sleep(3)
    # else:
    #     logger.error("❌ Neon DB connection failed after 3 retries.")

    # Initialize tables
    await init_db()
    logger.info("📦 Database initialized")

    yield  # --- Application runs here ---

    # Shutdown
    logger.info("🧹 Shutting down application...")
    await close_db()
    logger.info("🛑 Database connections closed")

# ============================================================
# FASTAPI APP INSTANCE
# ============================================================
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Makeup Assistant API",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# ============================================================
# STATIC FILES + FAVICON HANDLING
# ============================================================
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Serve the favicon for browser requests"""
    favicon_path = os.path.join(static_dir, "favicon.ico")
    if os.path.exists(favicon_path):
        return FileResponse(favicon_path)
    return JSONResponse(status_code=404, content={"detail": "Favicon not found"})

# ============================================================
# MIDDLEWARE
# ============================================================
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Hosts (only in production)
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*.glamai.com", "glamai.com"]
    )

# ============================================================
# ROUTES
# ============================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "docs": "/docs" if settings.DEBUG else "disabled in production",
    }

# Include Routers
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_PREFIX}/auth",
    tags=["Authentication"],
)
app.include_router(
    profile.router,
    prefix=f"{settings.API_V1_PREFIX}/profile",
    tags=["Profile"],
)
app.include_router(
    makeup.router,
    prefix=f"{settings.API_V1_PREFIX}/makeup",
    tags=["Makeup Sessions"],
)
app.include_router(
    vanity.router,
    prefix=f"{settings.API_V1_PREFIX}/vanity",
    tags=["Vanity - Product Inventory"],
)
app.include_router(
    events.router,
    prefix=f"{settings.API_V1_PREFIX}/events",
    tags=["Events & Scheduling"],
)
app.include_router(api_v1_router)

# ============================================================
# EXCEPTION HANDLERS
# ============================================================
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "Resource not found"},
    )

# ============================================================
# ENTRY POINT
# ============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
