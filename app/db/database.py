"""
GlamAI - Database Configuration
Async + Sync SQLAlchemy setup with Neon SSL
"""

import ssl
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine
from app.core.config import settings
from loguru import logger




# ============================================================
# SSL CONTEXT (required for Neon connections)
# ============================================================
ssl_context = ssl.create_default_context()

# ============================================================
# ASYNC ENGINE (used by FastAPI runtime)
# ============================================================
# Must use: postgresql+asyncpg://user:pass@host/dbname  (no ?sslmode=require)
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    connect_args={"ssl": ssl_context},
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
    echo=settings.DEBUG,
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
# async def get_db() -> AsyncSession:
#     """
#     FastAPI dependency that provides an async DB session.
#     Handles commit, rollback, and close automatically.
#     """
#     async with AsyncSessionLocal() as session:
#         try:
#             yield session
#             await session.commit()
#         except Exception as e:
#             logger.error(f"❌ Database session error: {e}")
#             await session.rollback()
#             raise
#         finally:
#             await session.close()
# ✅ app/db/database.py


async def get_db() -> AsyncSession:
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
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database schema initialized successfully.")

async def close_db():
    """
    Dispose all database connections gracefully.
    """
    await async_engine.dispose()
    logger.info("🛑 Async engine connections closed.")
