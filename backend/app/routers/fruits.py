"""
Shelf Life Estimator — Fruits Router
=======================================
CRUD endpoints for the fruit reference database.
Includes subcategory filtering and ethylene compatibility checking.
"""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, Query

from app.database import get_db
from app.models.schema import Fruit
from app.schemas.schemas import (
    FruitCreate,
    FruitList,
    FruitResponse,
    FruitSubcategory,
    CompatibilityResponse,
    MessageResponse,
)
from app.ai.compatibility import check_compatibility

router = APIRouter(prefix="/api/fruits", tags=["Fruits"])


# ============================================
# List / Search Fruits
# ============================================

@router.get(
    "/",
    response_model=FruitList,
    summary="List all fruits",
    description="Get a paginated list of all fruits in the database. "
    "Supports filtering by subcategory and searching by name.",
)
async def get_fruits(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    subcategory: FruitSubcategory | None = Query(None, description="Filter by subcategory (citrus, berries, tropical, etc.)"),
    search: str | None = Query(None, description="Search by fruit name"),
    ethylene_producer: bool | None = Query(None, description="Filter by ethylene production"),
    db: AsyncSession = Depends(get_db),
):
    """Get all fruits with optional filtering and pagination."""
    query = select(Fruit)

    # Apply filters
    if subcategory:
        query = query.where(Fruit.subcategory == subcategory.value)
    if search:
        query = query.where(Fruit.name.ilike(f"%{search}%"))
    if ethylene_producer is not None:
        query = query.where(Fruit.is_ethylene_producer == ethylene_producer)

    # Count total matching items
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Apply pagination and sorting
    query = query.offset((page - 1) * per_page).limit(per_page)
    query = query.order_by(Fruit.name)

    result = await db.execute(query)
    items = result.scalars().all()

    return FruitList(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
    )


# ============================================
# Subcategories
# ============================================

@router.get(
    "/subcategories",
    response_model=list[str],
    summary="List all fruit subcategories",
)
async def get_subcategories(db: AsyncSession = Depends(get_db)):
    """Get a list of all unique fruit subcategories (citrus, berries, etc.)."""
    result = await db.execute(
        select(Fruit.subcategory).distinct().order_by(Fruit.subcategory)
    )
    return result.scalars().all()


# ============================================
# Compatibility Check (Phase D)
# ============================================

@router.get(
    "/compatibility",
    response_model=CompatibilityResponse,
    summary="Check fruit storage compatibility",
    description="Check if a group of fruits can be safely stored together. "
    "Uses ethylene gas interaction data to identify conflicts.",
)
async def check_fruit_compatibility(
    fruits: str = Query(
        ...,
        description="Comma-separated list of fruit names to check",
        examples=["Apple,Banana,Strawberry"],
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Check ethylene compatibility for a group of fruits.

    Example: /api/fruits/compatibility?fruits=Apple,Banana,Strawberry

    DSA: Uses graph adjacency list for O(1) conflict lookups per pair.
    """
    fruit_names = [name.strip() for name in fruits.split(",") if name.strip()]

    if not fruit_names:
        raise HTTPException(
            status_code=400,
            detail="Please provide at least one fruit name.",
        )

    # Validate every requested name against the fruit database.
    # Unknown names must never silently count as "safe to store together" —
    # this is a safety feature, so false-all-clear is the worst failure mode.
    result = await db.execute(select(Fruit.name))
    known_names = {row[0].lower() for row in result.all()}
    unknown = [n for n in fruit_names if n.lower() not in known_names]

    if len(unknown) == len(fruit_names):
        raise HTTPException(
            status_code=404,
            detail=(f"No recognized fruit names in request. Unknown: {unknown}. "
                    "Use the fruit database names (GET /api/fruits/)."),
        )

    result = check_compatibility(fruit_names)
    compatibility = CompatibilityResponse(unknown_names=unknown, **result)
    return compatibility


# ============================================
# Single Fruit Details
# ============================================

@router.get(
    "/{fruit_id}",
    response_model=FruitResponse,
    summary="Get fruit details",
)
async def get_fruit(fruit_id: int, db: AsyncSession = Depends(get_db)):
    """Get detailed information about a specific fruit including storage tips and ethylene data."""
    result = await db.execute(select(Fruit).where(Fruit.id == fruit_id))
    fruit = result.scalar_one_or_none()

    if not fruit:
        raise HTTPException(status_code=404, detail=f"Fruit with id {fruit_id} not found")

    return fruit


# ============================================
# Create / Delete Fruits
# ============================================

@router.post(
    "/",
    response_model=FruitResponse,
    status_code=201,
    summary="Add a new fruit",
)
async def create_fruit(fruit: FruitCreate, db: AsyncSession = Depends(get_db)):
    """Add a new fruit to the reference database."""
    # Check for duplicate name
    existing = await db.execute(
        select(Fruit).where(Fruit.name.ilike(fruit.name))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"Fruit '{fruit.name}' already exists"
        )

    db_fruit = Fruit(**fruit.model_dump())
    db.add(db_fruit)
    await db.flush()
    await db.refresh(db_fruit)

    return db_fruit


@router.delete(
    "/{fruit_id}",
    response_model=MessageResponse,
    summary="Delete a fruit",
)
async def delete_fruit(fruit_id: int, db: AsyncSession = Depends(get_db)):
    """Remove a fruit from the reference database."""
    result = await db.execute(select(Fruit).where(Fruit.id == fruit_id))
    fruit = result.scalar_one_or_none()

    if not fruit:
        raise HTTPException(status_code=404, detail=f"Fruit with id {fruit_id} not found")

    await db.delete(fruit)
    return MessageResponse(message=f"Fruit '{fruit.name}' deleted successfully")
