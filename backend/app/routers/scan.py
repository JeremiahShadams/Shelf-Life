"""
Fresco — Scan Router (HTTP Layer ONLY)
========================================
Handles HTTP concerns: file upload validation, calling the service,
returning the response. Zero business logic lives here.

Architecture rule:
    This router should NEVER import classifier, freshness, estimator,
    or decision_engine directly. It talks ONLY to scan_service.
"""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.schemas import ScanResponse
from app.services.scan_service import process_scan, validate_image, ScanError

router = APIRouter(prefix="/api/scan", tags=["Scan"])


@router.post(
    "/",
    response_model=ScanResponse,
    summary="Scan a fruit",
    description=(
        "Upload an image of a fruit. The system will identify it, "
        "assess its freshness, estimate shelf life, check ethylene "
        "compatibility, and return a unified verdict."
    ),
)
async def scan_fruit(
    image: UploadFile = File(..., description="Image of the fruit to scan"),
    db: AsyncSession = Depends(get_db),
):
    """
    Scan endpoint — HTTP concerns only.

    1. Read the uploaded file
    2. Validate (type + size)
    3. Hand off to scan_service.process_scan()
    4. Return the result

    No AI logic. No database queries. No estimation.
    Those all live in the service layer.
    """
    # Read file contents
    contents = await image.read()

    # Validate image (type + size)
    try:
        await validate_image(image.content_type, contents)
    except ScanError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    # Hand off to the service layer — where all the real work happens
    try:
        result = await process_scan(
            contents=contents,
            filename=image.filename,
            db=db,
        )
    except ScanError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    return result
