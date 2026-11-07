"""
FRESCO — Expiry Reminder Background Worker
==========================================
Scans for due expiry notifications, delivers push alerts to user devices,
and updates notification delivery status.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import async_session
from app.models.schema import Notification, UserInventory, User, Fruit
from app.services.push_service import send_expo_push_notification

logger = logging.getLogger(__name__)


def utc_now() -> datetime:
    """Current UTC datetime without timezone info for DB comparison."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def process_due_notifications() -> int:
    """
    Find and dispatch all pending notifications where notify_at <= now.
    Returns the count of successfully processed notifications.
    """
    now = utc_now()
    processed_count = 0

    async with async_session() as db:
        try:
            # Query pending alerts whose trigger time has arrived
            stmt = (
                select(Notification)
                .join(UserInventory, Notification.inventory_id == UserInventory.id)
                .join(User, UserInventory.user_id == User.id)
                .where(
                    Notification.sent == False,
                    Notification.notify_at <= now,
                )
                .options(
                    selectinload(Notification.inventory_item).selectinload(UserInventory.fruit),
                    selectinload(Notification.inventory_item).selectinload(UserInventory.user),
                )
            )

            result = await db.execute(stmt)
            due_notifications = result.scalars().all()

            for notification in due_notifications:
                item = notification.inventory_item
                if not item:
                    notification.sent = True
                    continue

                user = item.user
                fruit = item.fruit

                fruit_name = fruit.name if fruit else "fruit"
                title = f"FRESCO Alert: Eat your {fruit_name} soon"
                body = notification.message

                # Dispatch push notification if user opted in and has registered device token
                if user and user.notifications_enabled and user.push_token:
                    await send_expo_push_notification(
                        push_token=user.push_token,
                        title=title,
                        body=body,
                        data={
                            "inventory_id": item.id,
                            "fruit_name": fruit_name,
                            "type": "expiry_alert",
                        },
                    )

                # Mark notification sent so it doesn't fire again
                notification.sent = True
                processed_count += 1

            if processed_count > 0:
                await db.commit()
                logger.info("Processed %d due expiry notifications.", processed_count)

        except Exception as exc:
            await db.rollback()
            logger.error("Error processing due notifications: %s", exc)

    return processed_count


async def reminder_worker_loop(interval_seconds: int = 900) -> None:
    """
    Background worker loop that runs periodically (defaults to every 15 minutes).
    Runs as an async task inside the FastAPI application lifespan.
    """
    logger.info("Starting FRESCO expiry reminder background worker (interval: %ds)", interval_seconds)
    while True:
        try:
            await process_due_notifications()
        except asyncio.CancelledError:
            logger.info("FRESCO reminder background worker cancelled.")
            break
        except Exception as exc:
            logger.error("Unexpected error in reminder worker loop: %s", exc)

        await asyncio.sleep(interval_seconds)

