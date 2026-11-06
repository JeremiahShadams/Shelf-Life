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
        if "sqlite" in db_url:
            def _check_and_add_columns(sync_conn):
                raw_cursor = sync_conn.connection.cursor()
                raw_cursor.execute("PRAGMA table_info(users)")
                columns = {row[1] for row in raw_cursor.fetchall()}
                new_cols = [
                    ("push_token", "VARCHAR(255)"),
                    ("notifications_enabled", "BOOLEAN DEFAULT 1"),
                    ("weight_unit", "VARCHAR(10) DEFAULT 'kg'"),
                    ("default_storage", "VARCHAR(20) DEFAULT 'fridge'"),
                ]
                for col_name, col_def in new_cols:
                    if col_name not in columns:
                        raw_cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
                sync_conn.connection.commit()
            await conn.run_sync(_check_and_add_columns)
