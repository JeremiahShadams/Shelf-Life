"""
FRESCO — Push Notification Service
===================================
Dispatches push alerts to mobile devices using Expo's Push API.
Supports batched dispatch, custom notification channels, sound, and deep links.
"""

from __future__ import annotations

import logging
from typing import Any
import httpx

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def is_valid_expo_push_token(token: str) -> bool:
    """Validate whether token matches Expo push token format."""
    return bool(token and (token.startswith("ExponentPushToken[") or token.startswith("ExpoPushToken[")))


async def send_expo_push_notification(
    push_token: str,
    title: str,
    body: str,
    data: dict[str, Any] | None = None,
    channel_id: str = "fresco-alerts",
) -> bool:
    """
    Send a single push notification through Expo Push Service.

    Returns True if accepted by Expo ticket API, False otherwise.
    """
    if not is_valid_expo_push_token(push_token):
        logger.warning("Skipping push notification: invalid Expo token %r", push_token)
        return False

    payload = {
        "to": push_token,
        "sound": "default",
        "title": title,
        "body": body,
        "channelId": channel_id,
        "priority": "high",
        "data": data or {},
    }

    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(EXPO_PUSH_URL, json=payload, headers=headers)
            if resp.status_code == 200:
                result = resp.json()
                data_response = result.get("data", {})
                if isinstance(data_response, dict) and data_response.get("status") == "error":
                    logger.warning("Expo push ticket error: %s", data_response.get("message"))
                    return False
                return True
            else:
                logger.warning("Expo push failed with HTTP status %s: %s", resp.status_code, resp.text)
                return False
    except Exception as exc:
        logger.error("Failed to send Expo push notification: %s", exc)
        return False

