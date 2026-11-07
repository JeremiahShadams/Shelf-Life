"""
Shelf Life Estimator — Application Configuration
=================================================
Loads settings from environment variables with sensible defaults.
Uses pydantic-settings for type-safe configuration.
"""

from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # silently drop env vars that don't map to a Settings field
    )

    # --- Application ---
    app_name: str = "Shelf Life Estimator"
    app_version: str = "1.0.0"
    debug: bool = True

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug(cls, value: Any) -> Any:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "prod", "production"}:
                return False
            if normalized in {"dev", "development"}:
                return True
        return value

    # --- Database ---
    # Default to a local SQLite file for developer convenience so the
    # backend can run without an external database server.
    database_url: str = "sqlite+aiosqlite:///./shelf_life_dev.db"

    # --- CORS ---
    allowed_origins: str = (
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:8081,http://127.0.0.1:8081,"
        "http://localhost:19006,http://127.0.0.1:19006"
    )

    # --- Security ---
    secret_key: str = "dev-secret-key-change-in-production"
    access_token_expire_minutes: int = 30

    @model_validator(mode="after")
    def guard_production_secrets(self) -> "Settings":
        """
        A JWT signed with the placeholder key is trivially forgeable — anyone
        who reads the open-source repo can mint tokens for any user. Refuse
        to boot in production (debug off) until a real key is provided.
        """
        if not self.debug and self.secret_key == "dev-secret-key-change-in-production":
            raise ValueError(
                "SECRET_KEY is unset or still the development default while "
                "debug=False. Set SECRET_KEY in the environment before "
                "running in production."
            )
        return self

    # --- File Uploads & Cloud Object Storage ---
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 10
    storage_backend: str = "local"  # "local", "s3", "r2"
    s3_bucket: str = ""
    s3_region: str = "us-east-1"
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_endpoint_url: str = ""  # Cloudflare R2 / MinIO endpoint
    s3_public_url: str = ""    # Public CDN prefix (e.g. https://cdn.frescoapp.com)

    # --- Demo Mode ---
    demo_mode: bool = False

    # --- AI Models ---
    classifier_model_path: str = "models/fresco_model.keras"
    freshness_model_path: str = "models/fresco_model.keras"

    @property
    def backend_dir(self) -> Path:
        """Return the backend project directory regardless of the current working directory."""
        return Path(__file__).resolve().parents[1]

    def resolve_backend_path(self, path_value: str) -> Path:
        """Resolve a path relative to the backend directory when needed."""
        path = Path(path_value)
        return path if path.is_absolute() else (self.backend_dir / path).resolve()

    @property
    def upload_dir_path(self) -> Path:
        """Absolute path to the upload directory."""
        return self.resolve_backend_path(self.upload_dir)

    @property
    def classifier_model_file(self) -> Path:
        """Absolute path to the fruit classifier model file."""
        default_path = self.resolve_backend_path(self.classifier_model_path)
        if default_path.is_file():
            return default_path
        # Also check common alternative filename from notebook export
        alt_path = self.resolve_backend_path("models/fresco_fruit_classifier.keras")
        if alt_path.is_file():
            return alt_path
        return default_path

    @property
    def freshness_model_file(self) -> Path:
        """Absolute path to the freshness model file."""
        default_path = self.resolve_backend_path(self.freshness_model_path)
        if default_path.is_file():
            return default_path
        alt_path = self.resolve_backend_path("models/fresco_fruit_classifier.keras")
        if alt_path.is_file():
            return alt_path
        return default_path

    @property
    def cors_origins(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    """
    Get cached application settings.
    Uses lru_cache so .env is only read once.
    """
    return Settings()
