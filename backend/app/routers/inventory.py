"""
Shelf Life Estimator — Inventory Router
=========================================
Manage the user's personal fruit inventory.
Track scanned items, update storage methods, mark consumed.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.schema import Fruit, UserInventory, Notification
from app.schemas.schemas import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse,
    InventoryListResponse,
    MessageResponse,
)
from app.ai.estimator import estimate_shelf_life, get_days_for_method
from app.auth import get_current_user
from app.models.schema import User as UserModel
from app.services.storage import storage_service
from app.services.expiry import (
    compute_days_left,
    compute_status,
    remaining_fraction_of_life,
    utc_now,
)

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


def _present_item(item: UserInventory, now: datetime) -> InventoryItemResponse:
    """
    Convert an ORM item to a response with truthful, computed expiry state.
    The stored estimated_days_remaining is a snapshot — the response always
    exposes live values so a fridge list written last week shows reality.
    """
    response = InventoryItemResponse.model_validate(item)
    days_left = compute_days_left(item.estimated_expiry, now)
    response.days_left = days_left
    response.status = compute_status(days_left)
    response.is_expired = days_left <= 0
    return response


@router.get(
    "/",
    response_model=InventoryListResponse,
    summary="Get user's inventory",
    description="Get all fruits in the user's inventory with freshness status.",
)
async def get_inventory(
    include_consumed: bool = Query(False, description="Include consumed items"),
    include_expired: bool = Query(True, description="Include expired items"),
    sort_by: str = Query("expiry", description="Sort by: expiry, name, freshness, added"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Get the user's full fruit inventory with summary stats."""
    query = (
        select(UserInventory)
        .options(selectinload(UserInventory.fruit))
        .where(UserInventory.user_id == current_user.id)
    )

    if not include_consumed:
        query = query.where(UserInventory.is_consumed == False)
    if not include_expired:
        query = query.where(UserInventory.is_expired == False)

    # Apply sorting
    if sort_by == "expiry":
        query = query.order_by(UserInventory.estimated_expiry.asc())
    elif sort_by == "name":
        query = query.order_by(UserInventory.fruit_id)
    elif sort_by == "freshness":
        query = query.order_by(UserInventory.freshness_score.desc())
    elif sort_by == "added":
        query = query.order_by(UserInventory.scanned_at.desc())

    result = await db.execute(query)
    items = result.scalars().all()

    # Truthful live state — recomputed for every item at read time
    now = utc_now()
    rendered = [_present_item(item, now) for item in items]

    expiring_soon = sum(
        1 for r in rendered if r.days_left > 0 and r.days_left <= 2
    )
    expired = sum(1 for r in rendered if r.days_left <= 0)

    return InventoryListResponse(
        items=rendered,
        total=len(items),
        expiring_soon=expiring_soon,
        expired=expired,
    )


@router.post(
    "/",
    response_model=InventoryItemResponse,
    status_code=201,
    summary="Add fruit to inventory",
)
async def add_to_inventory(
    item: InventoryItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Add a scanned/selected fruit to the user's inventory."""
    # Verify the fruit exists
    result = await db.execute(
        select(Fruit).where(Fruit.id == item.fruit_id)
    )
    fruit = result.scalar_one_or_none()

    if not fruit:
        raise HTTPException(
            status_code=404,
            detail=f"Fruit with id {item.fruit_id} not found"
        )

    # Calculate shelf life using the upgraded multi-factor formula
    shelf_life = estimate_shelf_life(
        shelf_life_room_temp=fruit.shelf_life_room_temp_days,
        shelf_life_fridge=fruit.shelf_life_fridge_days,
        shelf_life_freezer=fruit.shelf_life_freezer_days,
        freshness_score=item.freshness_score,
        optimal_temp_min=fruit.optimal_temp_min,
        optimal_temp_max=fruit.optimal_temp_max,
    )
    days_remaining = get_days_for_method(shelf_life, item.storage_method.value)

    now = datetime.utcnow()
    estimated_expiry = now + timedelta(days=days_remaining)

    # Create inventory item
    inventory_item = UserInventory(
        user_id=current_user.id,
        fruit_id=item.fruit_id,
        freshness_score=item.freshness_score,
        storage_method=item.storage_method.value,
        estimated_days_remaining=days_remaining,
        scanned_at=now,
        estimated_expiry=estimated_expiry,
        is_expired=False,
        is_consumed=False,
        image_path=item.image_path,
        quantity=item.quantity,
        notes=item.notes,
    )

    db.add(inventory_item)
    await db.flush()

    # Expiry alert. An item with <=1 day left is the MOST urgent case — it
    # must notify immediately, not never (the old `> 1` guard skipped it).
    if days_remaining > 1:
        message = f"⚠️ Your {fruit.name} expires tomorrow! Consider using it today."
        notify_at = estimated_expiry - timedelta(days=1)
    else:
        message = f"‼️ Your {fruit.name} needs to be used today or frozen."
        notify_at = now
    db.add(
        Notification(
            inventory_id=inventory_item.id,
            message=message,
            notify_at=notify_at,
            sent=False,
        )
    )

    # Commit explicitly so the row is durable before the response goes out —
    # get_db's after-yield commit runs after the response is sent, which lets
    # an immediately-following read race the write and see stale state.
    await db.commit()

    # Load the fruit relationship for the response
    result = await db.execute(
        select(UserInventory)
        .options(selectinload(UserInventory.fruit))
        .where(UserInventory.id == inventory_item.id)
    )
    inventory_item = result.scalar_one()

    return _present_item(inventory_item, utc_now())


@router.get(
    "/{item_id}",
    response_model=InventoryItemResponse,
    summary="Get inventory item details",
)
async def get_inventory_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Get detailed information about a specific inventory item."""
    result = await db.execute(
        select(UserInventory)
        .options(selectinload(UserInventory.fruit))
        .where(
            UserInventory.id == item_id,
            UserInventory.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    return _present_item(item, utc_now())


@router.patch(
    "/{item_id}",
    response_model=InventoryItemResponse,
    summary="Update inventory item",
)
async def update_inventory_item(
    item_id: int,
    update: InventoryItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Update an inventory item (storage method, mark consumed, etc.)."""
    result = await db.execute(
        select(UserInventory)
        .options(selectinload(UserInventory.fruit))
        .where(
            UserInventory.id == item_id,
            UserInventory.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    # Apply updates
    if update.is_consumed is not None:
        item.is_consumed = update.is_consumed

    if update.quantity is not None:
        item.quantity = update.quantity

    if update.notes is not None:
        item.notes = update.notes

    # If storage method changed, recalculate shelf life.
    # Rule: time already passed is preserved (remaining share of life), so a
    # user cannot "reset the clock" by toggling storage methods near expiry.
    if update.storage_method is not None and (
        update.storage_method.value != item.storage_method
    ):
        item.storage_method = update.storage_method.value

        # Full life the new storage method would give the fruit's
        # stored freshness score — as if scanned fresh today.
        new_full_life = get_days_for_method(
            estimate_shelf_life(
                shelf_life_room_temp=item.fruit.shelf_life_room_temp_days,
                shelf_life_fridge=item.fruit.shelf_life_fridge_days,
                shelf_life_freezer=item.fruit.shelf_life_freezer_days,
                freshness_score=item.freshness_score,
                optimal_temp_min=item.fruit.optimal_temp_min,
                optimal_temp_max=item.fruit.optimal_temp_max,
            ),
            update.storage_method.value,
        )

        # Scale by the share of life actually left, then restart the deadline
        # from now. Elapsed days spent under the old method stay consumed.
        fraction_left = remaining_fraction_of_life(item.estimated_expiry, item.scanned_at, utc_now())
        now = utc_now()
        item.estimated_days_remaining = round(max(new_full_life * fraction_left, 0.02), 4)
        item.estimated_expiry = now + timedelta(days=item.estimated_days_remaining)

        # The old notification row predicts a deadline that no longer exists.
        # Bulk delete avoids a lazy-load of the notifications relationship
        # inside an async session (MissingGreenlet).
        await db.execute(
            sa_delete(Notification).where(Notification.inventory_id == item.id)
        )

        # Same rule as add: re-arm the alert, and never drop it just because
        # the remaining life is short — that is exactly when it matters.
        if item.estimated_days_remaining > 1:
            message = (
                f"\u26a0\ufe0f Your {item.fruit.name} expires tomorrow! "
                "Consider using it today."
            )
            notify_at = item.estimated_expiry - timedelta(days=1)
        else:
            message = (
                f"\u203c\ufe0f Your {item.fruit.name} needs to be used today or frozen."
            )
            notify_at = utc_now()
        db.add(
            Notification(
                inventory_id=item.id,
                message=message,
                notify_at=notify_at,
                sent=False,
            )
        )

    # Commit explicitly BEFORE rendering: get_db's after-yield commit runs
    # after the response is sent, so a client reading immediately after a
    # PATCH could otherwise see pre-update state.
    await db.commit()

    # Re-select with the fruit loaded so _present_item can't trigger a
    # lazy-load inside the async session (MissingGreenlet).
    result = await db.execute(
        select(UserInventory)
        .options(selectinload(UserInventory.fruit))
        .where(UserInventory.id == item.id)
    )
    item = result.scalar_one()

    return _present_item(item, utc_now())


@router.delete(
    "/{item_id}",
    response_model=MessageResponse,
    summary="Remove from inventory",
)
async def delete_inventory_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Remove a fruit from the user's inventory."""
    result = await db.execute(
        select(UserInventory)
        .options(selectinload(UserInventory.fruit))
        .where(
            UserInventory.id == item_id,
            UserInventory.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    fruit_name = item.fruit.name
    image_to_delete = item.image_path

    # Remove the item's notifications with a bulk delete first — cascading
    # through the relationship would lazy-load inside the async session.
    await db.execute(
        sa_delete(Notification).where(Notification.inventory_id == item.id)
    )
    await db.delete(item)
    # Commit explicitly so the deletion is durable before the response is
    # sent (see add_to_inventory for the why — this fixes the flaky
    # GET-after-DELETE race).
    await db.commit()

    if image_to_delete:
        await storage_service.delete_image(image_to_delete)

    return MessageResponse(message=f"'{fruit_name}' removed from inventory")
