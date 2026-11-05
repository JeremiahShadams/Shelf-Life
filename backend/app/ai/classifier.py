"""
Fruit Classifier — Real inference using fresco_model.keras (MobileNetV2).

Trained on 22 fruit types with a binary freshness label:
  <Fruit>_Fresh / <Fruit>_Rotten  (44 classes total)

The class order below is the alphabetical order Keras flow_from_dataframe
assigns, which is what the model's output layer was trained against.
Do NOT reorder CLASS_NAMES without retraining: index i must match output i.
"""

import asyncio
import os

import numpy as np
from PIL import Image

os.environ.setdefault("KERAS_BACKEND", "numpy")
import keras  # noqa: E402  — backend env var must be set before import

from app.ai.freshness import get_freshness_label

# 44 classes = 22 fruits x {Fresh, Rotten}, in Keras' sorted class order.
CLASS_NAMES = [
    "Apple_Fresh",        # 0
    "Apple_Rotten",       # 1
    "Banana_Fresh",       # 2
    "Banana_Rotten",      # 3
    "Bellpepper_Fresh",   # 4
    "Bellpepper_Rotten",  # 5
    "Carrot_Fresh",       # 6
    "Carrot_Rotten",      # 7
    "Cucumber_Fresh",     # 8
    "Cucumber_Rotten",    # 9
    "Gourd_Fresh",        # 10
    "Gourd_Rotten",       # 11
    "Grape_Fresh",        # 12
    "Grape_Rotten",       # 13
    "Grapes_Fresh",       # 14
    "Grapes_Rotten",      # 15
    "Guava_Fresh",        # 16
    "Guava_Rotten",       # 17
    "Jujube_Fresh",       # 18
    "Jujube_Rotten",      # 19
    "Kaki_Fresh",         # 20
    "Kaki_Rotten",        # 21
    "Lime_Fresh",         # 22
    "Lime_Rotten",        # 23
    "Mango_Fresh",        # 24
    "Mango_Rotten",       # 25
    "Orange_Fresh",       # 26
    "Orange_Rotten",      # 27
    "Papaya_Fresh",       # 28
    "Papaya_Rotten",      # 29
    "Peach_Fresh",        # 30
    "Peach_Rotten",       # 31
    "Pear_Fresh",         # 32
    "Pear_Rotten",        # 33
    "Pomegranate_Fresh",  # 34
    "Pomegranate_Rotten", # 35
    "Potato_Fresh",       # 36
    "Potato_Rotten",      # 37
    "Strawberry_Fresh",   # 38
    "Strawberry_Rotten",  # 39
    "Tomato_Fresh",       # 40
    "Tomato_Rotten",      # 41
    "Watermelon_Fresh",   # 42
    "Watermelon_Rotten",  # 43
]

# The dataset is binary, so these are the only two honest freshness values.
# Rotten maps low enough to land in the decision engine's SPOILED band.
_STATE_SCORES: dict[str, float] = {
    "Fresh": 0.85,
    "Rotten": 0.10,
}

# Dataset fruit names that differ from the seed database names.
_FRUIT_ALIASES: dict[str, str] = {
    "Grapes": "Grape",
    "Kaki": "Persimmon",
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


def _run_inference(model, arr: np.ndarray) -> np.ndarray:
    # Called in a thread pool — keeps the ASGI event loop unblocked during
    # the CPU-bound model.predict() call (~0.5s on numpy backend).
    return model.predict(arr, verbose=0)


async def classify_fruit(image_path: str) -> dict:
    """
    Classify a fruit image using the trained fresco_model.keras.

    Returns:
        name            - Fruit name matching the seed database where possible
        confidence      - Model confidence for the top class (0-1)
        freshness_score - 0.85 for Fresh, 0.10 for Rotten
        freshness_label - Human-readable label derived from the score
        expired         - True when the top class is a Rotten class
    """
    model = _get_model()
    arr = _preprocess(image_path)
    preds = await asyncio.to_thread(_run_inference, model, arr)
    del arr

    idx = int(np.argmax(preds[0]))
    confidence = float(preds[0][idx])
    class_name = CLASS_NAMES[idx]
    fruit_name, state = class_name.rsplit("_", 1)
    fruit_name = _FRUIT_ALIASES.get(fruit_name, fruit_name)

    # TRUST RULE: never suppress the Rotten class. Masking it (as the old
    # 14-class code did) turns a spoiled prediction into a false "fresh"
    # verdict, which is the most dangerous error this app can make.
    freshness_score = _STATE_SCORES[state]
    freshness_label = get_freshness_label(freshness_score)

    return {
        "name": fruit_name,
        "confidence": round(confidence, 4),
        "freshness_score": freshness_score,
        "freshness_label": freshness_label,
        "expired": state == "Rotten",
    }
