"""Deployment shim for `uvicorn app.main:app` when launched from the repo root.

Render launches uvicorn from the repository root with `uvicorn app.main:app`,
but the FastAPI application lives under `backend/app`. This module makes that
command work by re-importing the real backend app package.
"""

import os
import sys

_BACKEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")

sys.path.insert(0, _BACKEND_DIR)

# Drop this shim from the import cache so the real backend `app` package loads.
sys.modules.pop("app", None)
sys.modules.pop("app.main", None)

from app.main import app  # noqa: E402