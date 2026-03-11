from __future__ import annotations

import io
import os

import httpx

from app.core.config import settings
from app.core.logging_config import logger
from app.models.report import XRayFinding

_MODEL_VERSION = "efficientnet_b0_v1"
_session = None


def _get_session():
    global _session
    if _session is not None:
        return _session

    import onnxruntime as ort  # noqa: PLC0415

    cache_path = settings.MODEL_CACHE_PATH
    if not os.path.exists(cache_path):
        logger.info("Downloading ONNX model from %s", settings.ONNX_MODEL_URL)
        response = httpx.get(settings.ONNX_MODEL_URL, timeout=120)
        response.raise_for_status()
        os.makedirs(os.path.dirname(cache_path) or ".", exist_ok=True)
        with open(cache_path, "wb") as fh:
            fh.write(response.content)
        logger.info("Model cached at %s", cache_path)

    _session = ort.InferenceSession(
        cache_path, providers=["CPUExecutionProvider"]
    )
    return _session


def _preprocess(image_bytes: bytes):
    import numpy as np  # noqa: PLC0415
    from PIL import Image  # noqa: PLC0415

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((224, 224))
    arr = np.array(img, dtype=np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    arr = (arr - mean) / std
    arr = np.transpose(arr, (2, 0, 1))
    return np.expand_dims(arr, axis=0)


def run_xray_inference(file_url: str) -> XRayFinding:
    import numpy as np  # noqa: PLC0415

    logger.info("Running X-ray inference for URL: %s", file_url)
    response = httpx.get(file_url, timeout=60)
    response.raise_for_status()

    session = _get_session()
    input_array = _preprocess(response.content)
    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: input_array})

    logits = outputs[0][0]
    prob = float(1 / (1 + np.exp(-logits[1])))
    prediction = "Abnormal" if prob >= 0.5 else "Normal"
    confidence = prob if prediction == "Abnormal" else 1.0 - prob

    logger.info("X-ray result: %s (confidence=%.3f)", prediction, confidence)
    return XRayFinding(
        prediction=prediction,
        confidence=round(confidence, 4),
        model_version=_MODEL_VERSION,
    )
