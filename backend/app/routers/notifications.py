"""
Shelf Life Estimator — Notifications Router
===========================================
Read access to the user's expiry alerts. Notifications are created by the
inventory endpoints when an item is added or its storage changes; this
router is how the client ever sees them.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
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


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark a notification as read",
)
async def mark_notification_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Mark an individual notification as read (sent = True).
    """
    result = await db.execute(
        select(Notification)
        .join(UserInventory, Notification.inventory_id == UserInventory.id)
        .where(
            Notification.id == notification_id,
            UserInventory.user_id == current_user.id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notification.sent = True
    await db.commit()
    await db.refresh(notification)

    return NotificationResponse.model_validate(notification)


@router.post(
    "/mark-all-read",
    summary="Mark all user notifications as read",
)
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Mark all unread notifications for the current user as read.
    """
    result = await db.execute(
        select(Notification)
        .join(UserInventory, Notification.inventory_id == UserInventory.id)
        .where(
            UserInventory.user_id == current_user.id,
            Notification.sent == False,
        )
    )
    notifications = result.scalars().all()
    for n in notifications:
        n.sent = True

    await db.commit()
    return {"message": "All notifications marked as read", "count": len(notifications)}


@router.post(
    "/process-pending",
    summary="Process and dispatch pending notifications",
    description="Trigger due notifications check and push alert dispatch.",
)
async def trigger_process_due_notifications():
    """
    Called by background task or cloud scheduler to dispatch pending push alerts.
    """
    from app.services.reminder_worker import process_due_notifications
    count = await process_due_notifications()
    return {"message": "Processed due notifications", "count": count}


