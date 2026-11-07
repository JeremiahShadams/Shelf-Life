"""
FRESCO — Storage Service
========================
Unified abstraction for file storage:
- Local disk (development / offline)
- AWS S3 or Cloudflare R2 / MinIO (production cloud deployment)
"""

from __future__ import annotations

import logging
import os
import uuid
from pathlib import Path
from typing import Optional

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class StorageService:
    """Manages file storage with transparent cloud / local fallback."""

    def __init__(self):
        self.backend = settings.storage_backend.lower()
        self.bucket = settings.s3_bucket
        self.region = settings.s3_region
        self.endpoint_url = settings.s3_endpoint_url or None
        self.public_url = settings.s3_public_url.rstrip("/") if settings.s3_public_url else ""
        self.local_dir = settings.upload_dir_path

    def _is_cloud_configured(self) -> bool:
        """Check if S3/R2 credentials and bucket are configured."""
        return bool(
            self.backend in {"s3", "r2"}
            and self.bucket
            and settings.s3_access_key_id
            and settings.s3_secret_access_key
        )

    async def save_image(
        self,
        contents: bytes,
        original_filename: Optional[str] = None,
        content_type: str = "image/jpeg",
    ) -> tuple[Path, str]:
        """
        Saves image contents.

        Returns:
            tuple[Path, str]:
                - local_path: Path object on disk for immediate AI inference
                - public_path_or_url: Database-storable URL or relative path
        """
        file_ext = Path(original_filename).suffix if original_filename else ".jpg"
        unique_name = f"{uuid.uuid4()}{file_ext}"

        # 1. Always save a local copy for immediate TensorFlow / Keras image decoding
        self.local_dir.mkdir(parents=True, exist_ok=True)
        local_file_path = self.local_dir / unique_name
        with open(local_file_path, "wb") as f:
            f.write(contents)

        # 2. If Cloud S3 / R2 is configured, upload to bucket
        if self._is_cloud_configured():
            try:
                import boto3  # type: ignore
                from botocore.config import Config  # type: ignore

                s3_client = boto3.client(
                    "s3",
                    endpoint_url=self.endpoint_url,
                    aws_access_key_id=settings.s3_access_key_id,
                    aws_secret_access_key=settings.s3_secret_access_key,
                    region_name=self.region,
                    config=Config(signature_version="s3v4"),
                )

                s3_key = f"uploads/{unique_name}"
                s3_client.put_object(
                    Bucket=self.bucket,
                    Key=s3_key,
                    Body=contents,
                    ContentType=content_type,
                )

                if self.public_url:
                    cloud_url = f"{self.public_url}/{s3_key}"
                elif self.endpoint_url:
                    cloud_url = f"{self.endpoint_url}/{self.bucket}/{s3_key}"
                else:
                    cloud_url = f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{s3_key}"

                logger.info("Uploaded %s to cloud object storage: %s", unique_name, cloud_url)
                return local_file_path, cloud_url
            except Exception as exc:
                logger.warning(
                    "Cloud storage upload failed (%s). Falling back to local storage.", exc
                )

        # Default local storage relative path
        relative_path = f"uploads/{unique_name}"
        return local_file_path, relative_path

    async def delete_image(self, stored_path_or_url: str) -> bool:
        """Deletes image from local disk and cloud storage if present."""
        if not stored_path_or_url:
            return False

        # Attempt local delete
        filename = Path(stored_path_or_url).name
        local_file = self.local_dir / filename
        if local_file.is_file():
            try:
                local_file.unlink()
            except Exception as exc:
                logger.warning("Could not delete local file %s: %s", local_file, exc)

        # Attempt cloud delete if applicable
        if self._is_cloud_configured() and ("uploads/" in stored_path_or_url):
            try:
                import boto3  # type: ignore

                s3_client = boto3.client(
                    "s3",
                    endpoint_url=self.endpoint_url,
                    aws_access_key_id=settings.s3_access_key_id,
                    aws_secret_access_key=settings.s3_secret_access_key,
                    region_name=self.region,
                )
                s3_key = f"uploads/{filename}"
                s3_client.delete_object(Bucket=self.bucket, Key=s3_key)
                return True
            except Exception as exc:
                logger.warning("Could not delete cloud object %s: %s", stored_path_or_url, exc)

        return True


# Global singleton instance
storage_service = StorageService()
