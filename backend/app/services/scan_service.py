"""
Pipeline:
    Image → Classifier → Freshness → Estimator → Compatibility → Decision Engine → Verdict

"""

from __future__ import annotations

import io
import os
import uuid
from pathlib import Path

from PIL import Image

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.schema import Fruit
from app.services.storage import storage_service
from app.ai.classifier import classify_fruit
from app.ai.estimator import estimate_shelf_life
from app.ai.compatibility import check_compatibility
from app.ai.decision_engine import Verdict, produce_verdict

settings = get_settings()


class ScanError(Exception):


    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def save_uploaded_image(contents: bytes, original_filename: str | None) -> Path:
    """
    Save raw image bytes to the uploads directory.

    Returns the path to the saved file.
    """
    upload_dir = settings.upload_dir_path
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_ext = Path(original_filename).suffix if original_filename else ".jpg"
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = upload_dir / filename

    with open(file_path, "wb") as f:
        f.write(contents)

    return file_path


async def validate_image(content_type: str | None, contents: bytes) -> None:

    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/jpg"}

    if content_type not in allowed_types:
        raise ScanError(
            f"Invalid file type: {content_type}. Allowed: {', '.join(allowed_types)}",
            status_code=400,
        )

    max_size = settings.max_upload_size_mb * 1024 * 1024
    if len(contents) > max_size:
        raise ScanError(
            f"File too large. Maximum size: {settings.max_upload_size_mb}MB",
            status_code=400,
        )

    # Actually decode the pixels — a valid Content-Type with garbage bytes
    # must reach the user as a clean 415, not a 500 from the classifier.
    try:
        Image.open(io.BytesIO(contents)).verify()
    except Exception as e:
        raise ScanError(
            "The uploaded file claims to be an image but its data is "
            f"corrupt or undecodable. ({type(e).__name__})",
            status_code=415,
        )


def classifier_available() -> bool:
    """True when the trained model artifact exists on disk."""
    return settings.classifier_model_file.is_file()


MODEL_NOT_DEPLOYED = (
    "AI scanning is temporarily unavailable: the classifier model is not "
    "deployed on this server. Please add the item manually for now."
)


async def lookup_fruit(fruit_name: str, db: AsyncSession) -> Fruit:
    """
    Look up a fruit in the database by name.
    Tries exact match first, then fuzzy match.
    Raises ScanError if not found.
    """
    # Exact match (case-insensitive)
    result = await db.execute(
        select(Fruit).where(Fruit.name.ilike(fruit_name))
    )
    fruit = result.scalar_one_or_none()

    if fruit:
        return fruit

    # Fuzzy match (partial name containment)
    result = await db.execute(
        select(Fruit).where(Fruit.name.ilike(f"%{fruit_name}%"))
    )
    fruit = result.scalar_one_or_none()

    if fruit:
        return fruit

    raise ScanError(
        f"Fruit '{fruit_name}' identified by AI but not found in our database. "
        "Please try manual selection instead.",
        status_code=404,
    )


async def process_scan(contents: bytes, filename: str | None, db: AsyncSession) -> dict:
    """
    Execute the full scan pipeline.

    This is the backbone of the application. Everything flows through here.

    Pipeline:
        1. Save image to disk
        2. Classify fruit (AI Module 1) → fruit name + confidence
        3. Assess freshness (AI Module 2) → freshness score + label
        4. Look up fruit in database → base shelf life data
        5. Estimate shelf life (Math Engine) → days per storage method
        6. Check ethylene compatibility → warnings if applicable
        7. Produce verdict (Decision Engine) → unified user-facing output

    Args:
        contents: Raw image bytes.
        filename: Original filename (for extension detection).
        db: Async database session.

    Returns:
        dict: Complete scan result ready for API response serialization.

    Raises:
        ScanError: If any recoverable error occurs in the pipeline.
    """
    # --- Guard: model must be deployed before anything else happens ---
    # A missing .keras artifact is a deployment state, not a scan failure —
    # surface it as 503 Service Unavailable, never as a 500.
    if not classifier_available():
        raise ScanError(MODEL_NOT_DEPLOYED, status_code=503)

    # --- Step 1: Save image (local copy + cloud upload if configured) ---
    file_path, image_url = await storage_service.save_image(contents, filename)

    try:
        # --- Step 2: Classify the fruit ---
        try:
            classification = await classify_fruit(str(file_path))
        except ScanError:
            raise
        except Exception as e:
            # Most likely a missing/undeployed model artifact (ValueError from
            # keras.load_model) — report deployment state, not a scan failure.
            if not classifier_available():
                raise ScanError(MODEL_NOT_DEPLOYED, status_code=503)
            raise ScanError(f"Fruit classification failed: {e}", status_code=500)
        fruit_name = classification["name"]
        classification_confidence = classification["confidence"]

        # --- Step 3: Freshness (derived from model class stage) ---
        freshness_score = classification["freshness_score"]
        freshness_label = classification["freshness_label"]

        # --- Step 4: Database lookup ---
        fruit = await lookup_fruit(fruit_name, db)

        # --- Step 5: Estimate shelf life ---
        shelf_life_estimates = estimate_shelf_life(
            shelf_life_room_temp=fruit.shelf_life_room_temp_days,
            shelf_life_fridge=fruit.shelf_life_fridge_days,
            shelf_life_freezer=fruit.shelf_life_freezer_days,
            freshness_score=freshness_score,
            optimal_temp_min=fruit.optimal_temp_min,
            optimal_temp_max=fruit.optimal_temp_max,
        )

        # --- Step 6: Compatibility check ---
        # Check what this fruit conflicts with (ethylene interactions)
        compatibility_data = check_compatibility([fruit.name])
        compatibility_warnings = compatibility_data.get("incompatible_pairs", [])

        # --- Step 7: Decision Engine — produce the final verdict ---
        verdict: Verdict = produce_verdict(
            fruit_name=fruit.name,
            freshness_score=freshness_score,
            freshness_label=freshness_label,
            shelf_life_estimates=shelf_life_estimates,
            base_room_temp_days=fruit.shelf_life_room_temp_days,
            storage_tips=fruit.storage_tips,
            is_ethylene_producer=fruit.is_ethylene_producer,
            is_ethylene_sensitive=fruit.is_ethylene_sensitive,
            compatibility_warnings=compatibility_warnings,
        )

        # --- Assemble response ---
        return {
            # Fruit identity
            "fruit": fruit,
            "classification_confidence": classification_confidence,

            # Decision engine output (the core)
            "status": verdict.status,
            "confidence": verdict.confidence,
            "days_left": verdict.days_left,
            "recommendation": verdict.recommendation,

            # Detailed data (for frontend rendering)
            "freshness_score": verdict.freshness_score,
            "freshness_label": verdict.freshness_label,
            "estimated_shelf_life": verdict.shelf_life_by_method,
            "best_storage": verdict.best_storage,
            "storage_tip": verdict.storage_tip,

            # Ethylene intelligence
            "ethylene_note": verdict.ethylene_note,
            "compatibility_warnings": verdict.compatibility_warnings,

            # Metadata
            "image_path": image_url,
        }

    except ScanError:
        # Clean up image on known errors
        if file_path.exists():
            os.remove(file_path)
        raise

    except Exception as e:
        # Clean up image on unexpected errors
        if file_path.exists():
            os.remove(file_path)
        raise ScanError(
            f"An unexpected error occurred during scanning: {str(e)}",
            status_code=500,
        )
