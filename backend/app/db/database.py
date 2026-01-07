"""
GlamAI - Database Configuration
Async + Sync SQLAlchemy setup with SSL support
"""

import ssl
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine
from app.core.config import settings
from loguru import logger


# ============================================================
# SSL CONTEXT (required for Render/Neon connections)
# ============================================================
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False      # Don't verify hostname
ssl_context.verify_mode = ssl.CERT_NONE # Don't verify certificate

# ============================================================
# ASYNC ENGINE (used by FastAPI runtime)
# ============================================================
# Must use: postgresql+asyncpg://user:pass@host/dbname
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args={
        "ssl": ssl_context,
        "server_settings": {"jit": "off"}
    },
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# ============================================================
# SYNC ENGINE (used for Alembic migrations)
# ============================================================
# Must use: postgresql://user:pass@host/dbname?sslmode=require
sync_engine = create_engine(
    settings.DATABASE_URL_SYNC,
    echo=False,
    future=True,
    pool_pre_ping=True,
)

# ============================================================
# SESSION FACTORIES
# ============================================================
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

SessionLocal = sessionmaker(
    bind=sync_engine,
    autoflush=False,
    autocommit=False,
)

# ============================================================
# BASE CLASS
# ============================================================
Base = declarative_base()

# ============================================================
# DATABASE SESSION DEPENDENCY
# ============================================================
async def get_db():
    """
    FastAPI dependency that yields a fully async SQLAlchemy session.
    Automatically rolls back on errors and closes cleanly.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"❌ Database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()

# ============================================================
# INITIALIZATION HELPERS
# ============================================================
async def init_db():
    """
    Initialize database tables if they do not exist.
    Should be called once at startup (via lifespan or CLI).
    """
    logger.info("📦 Initializing database schema...")
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database schema initialized successfully.")
    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {e}")
        raise

async def close_db():
    """
    Dispose all database connections gracefully.
    """
    logger.info("🛑 Closing database connections...")
    await async_engine.dispose()
    logger.info("✅ Database connections closed.")