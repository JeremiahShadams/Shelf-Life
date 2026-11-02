"""
Fruit Classifier — Real inference using fresco_model.keras (MobileNetV2).

Trained on 4 fruit types across freshness stages:
  Apple, Banana, Carrot, Tomato (+ Expired class)

Each class name encodes the fruit type and a video-frame range.
Lower range numbers = earlier frames = fresher fruit.
"""

import asyncio
import os
import re

import numpy as np
from PIL import Image

os.environ.setdefault("KERAS_BACKEND", "numpy")
import keras  # noqa: E402  — backend env var must be set before import

from app.ai.freshness import get_freshness_label

# Class labels in the alphabetical order Keras flow_from_directory assigns them.
# 14 classes = 3 Apple + 4 Banana + 3 Carrot + 1 Expired + 3 Tomato
CLASS_NAMES = [
    "Apple(1-5)",    # 0
    "Apple(10-14)",  # 1
    "Apple(5-10)",   # 2
    "Banana(1-5)",   # 3
    "Banana(10-15)", # 4
    "Banana(15-20)", # 5
    "Banana(5-10)",  # 6
    "Carrot(1-2)",   # 7
    "Carrot(3-4)",   # 8
    "Expired",       # 9
    "Tomato(1-5)",   # 10
    "Tomato(10-15)", # 11
    "Tomato(5-10)",  # 12
    "carrot(5-6)",   # 13
]

# Freshness score per class.
# Lower range-start number = earlier in sequence = fresher fruit.
_FRESHNESS: dict[str, float] = {
    "Apple(1-5)":    0.90,
    "Apple(5-10)":   0.65,
    "Apple(10-14)":  0.35,
    "Banana(1-5)":   0.92,
    "Banana(5-10)":  0.68,
    "Banana(10-15)": 0.42,
    "Banana(15-20)": 0.18,
    "Carrot(1-2)":   0.90,
    "Carrot(3-4)":   0.60,
    "carrot(5-6)":   0.30,
    "Tomato(1-5)":   0.90,
    "Tomato(5-10)":  0.60,
    "Tomato(10-15)": 0.30,
    "Expired":       0.05,
}

_model = None


def _get_model():
    global _model
    if _model is None:
        from app.config import get_settings
        path = str(get_settings().classifier_model_file)
        _model = keras.models.load_model(path)
    return _model


def _preprocess(image_path: str) -> np.ndarray:
    img = Image.open(image_path).convert("RGB").resize((224, 224))
    arr = np.array(img, dtype=np.float32)
    arr = (arr / 127.5) - 1.0  # MobileNetV2 expects [-1, 1], not [0, 1]
    return np.expand_dims(arr, axis=0)  # (1, 224, 224, 3)


def _parse_fruit_name(class_name: str) -> str:
    """Strip the '(X-Y)' suffix and title-case the result."""
    return re.sub(r"\(\d+-\d+\)", "", class_name).strip().title()


def _run_inference(model, arr: np.ndarray) -> np.ndarray:
    # Called in a thread pool — keeps the ASGI event loop unblocked during
    # the CPU-bound model.predict() call (~0.5s on numpy backend).
    return model.predict(arr, verbose=0)


_EXPIRED_IDX = CLASS_NAMES.index("Expired")

# Demo freshness used until the freshness model is trained.
_DEMO_FRESHNESS_SCORE = 0.80
_DEMO_FRESHNESS_LABEL = "Fresh"


async def classify_fruit(image_path: str) -> dict:
    """
    Classify a fruit image using the trained fresco_model.keras.

    Returns:
        name            - Fruit name (title-cased, e.g. "Carrot")
        confidence      - Model confidence for the top fruit class (0-1)
        freshness_score - Demo value (0.80) until freshness model is trained
        freshness_label - Demo label ("Fresh") until freshness model is trained
        expired         - Always False in demo mode
    """
    model = _get_model()
    arr = _preprocess(image_path)
    preds = await asyncio.to_thread(_run_inference, model, arr)
    del arr

    # Mask out the Expired class so the model picks the best fruit type.
    # The Expired class dominates due to a training imbalance; fruit-type
    # recognition is still useful via the remaining 13 classes.
    scores = preds[0].copy()
    scores[_EXPIRED_IDX] = 0.0

    idx = int(np.argmax(scores))
    confidence = float(preds[0][idx])
    class_name = CLASS_NAMES[idx]

    # Freshness is derived from the predicted class's stage (e.g. Tomato(1-5)
    # vs Tomato(10-15)), so different ripeness stages yield different results.
    freshness_score = _FRESHNESS[class_name]
    freshness_label = get_freshness_label(freshness_score)

    return {
        "name": _parse_fruit_name(class_name),
        "confidence": round(confidence, 4),
        "freshness_score": freshness_score,
        "freshness_label": freshness_label,
        "expired": False,
    }
