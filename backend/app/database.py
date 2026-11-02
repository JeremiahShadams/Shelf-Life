"""
Shelf Life Estimator — Database Connection
===========================================
Async SQLAlchemy engine, session factory, and base model.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()


def _prepare_database_url(url: str) -> str:
    """
    Normalize the DATABASE_URL for the correct async driver.
    Handles MySQL, PostgreSQL, and SQLite formats.
    """
    # MySQL: ensure async driver
    if url.startswith("mysql://"):
        url = url.replace("mysql://", "mysql+aiomysql://", 1)

    # PostgreSQL: ensure async driver
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    return url


db_url = _prepare_database_url(settings.database_url)

# --- Async Engine ---
engine = create_async_engine(
    db_url,
    echo=settings.debug,  # Log SQL queries in debug mode
    future=True,
    # aiomysql's async connection ping signature is incompatible with
    # SQLAlchemy's pool pre-ping implementation (missing `reconnect` arg),
    # so disable `pool_pre_ping` when using aiomysql to avoid TypeError on startup.
    pool_pre_ping=False if "aiomysql" in db_url else True,
)

# --- Async Session Factory ---
async_session = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# --- Base Model ---
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


# --- Dependency Injection ---
async def get_db() -> AsyncSession:
    """
    FastAPI dependency that provides a database session.

    Usage in a route:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...

    The session is automatically closed after the request.
    """
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    Create all database tables on startup.
    In production, use Alembic migrations instead.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
