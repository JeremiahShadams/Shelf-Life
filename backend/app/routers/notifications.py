"""
Shelf Life Estimator — Notifications Router
===========================================
Read access to the user's expiry alerts. Notifications are created by the
inventory endpoints when an item is added or its storage changes; this
router is how the client ever sees them.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.schema import Notification, UserInventory, User as UserModel
from app.schemas.schemas import NotificationListResponse, NotificationResponse

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get(
    "",
    response_model=NotificationListResponse,
    summary="List my expiry notifications",
)
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    All notifications attached to the current user's inventory items,
    soonest first. Unsent ones first, then by when they should fire.
    """
    result = await db.execute(
        select(Notification)
        .join(UserInventory, Notification.inventory_id == UserInventory.id)
        .where(UserInventory.user_id == current_user.id)
        .order_by(Notification.sent.asc(), Notification.notify_at.asc())
    )
    notifications = result.scalars().all()

    return NotificationListResponse(
        items=[
            NotificationResponse.model_validate(n) for n in notifications
        ],
        total=len(notifications),
    )
