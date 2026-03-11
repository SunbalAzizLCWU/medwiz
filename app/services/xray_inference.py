import io
import logging
import os

import httpx
import numpy as np
import onnxruntime
from PIL import Image

from app.core.config import settings

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
INPUT_SIZE = 224
MODEL_VERSION = "v1.0"


def softmax(x: np.ndarray) -> np.ndarray:
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()


class XRayInferenceService:
    def __init__(self):
        self.session = None
        self.model_path = settings.MODEL_CACHE_PATH
        self.logger = logging.getLogger("auranode.xray")

    async def ensure_model_loaded(self):
        """Download ONNX model from Supabase Storage if not cached."""
        if self.session is not None:
            return
        if not os.path.exists(self.model_path):
            self.logger.info("Downloading ONNX model from storage...")
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.get(settings.ONNX_MODEL_URL)
                response.raise_for_status()
                with open(self.model_path, "wb") as f:
                    f.write(response.content)
            self.logger.info("Model downloaded successfully.")
        self.session = onnxruntime.InferenceSession(
            self.model_path,
            providers=["CPUExecutionProvider"],
        )
        self.logger.info("ONNX session initialized.")

    def preprocess_image(self, image_bytes: bytes) -> np.ndarray:
        """Convert raw image bytes to normalized float32 tensor."""
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize((INPUT_SIZE, INPUT_SIZE))
        img_array = np.array(image, dtype=np.float32) / 255.0
        for c in range(3):
            img_array[:, :, c] = (
                img_array[:, :, c] - IMAGENET_MEAN[c]
            ) / IMAGENET_STD[c]
        img_array = np.transpose(img_array, (2, 0, 1))  # HWC -> CHW
        img_array = np.expand_dims(img_array, axis=0)   # add batch dim
        return img_array.astype(np.float32)

    async def predict(self, image_bytes: bytes) -> dict:
        """Run inference. Returns prediction dict."""
        await self.ensure_model_loaded()
        input_tensor = self.preprocess_image(image_bytes)
        input_name = self.session.get_inputs()[0].name
        outputs = self.session.run(None, {input_name: input_tensor})
        # outputs[0] shape: (1, 2) — [normal_prob, abnormal_prob]
        probabilities = softmax(outputs[0][0])
        abnormal_prob = float(probabilities[1])
        prediction = "Abnormal" if abnormal_prob >= 0.5 else "Normal"
        return {
            "prediction": prediction,
            "confidence": round(
                abnormal_prob if prediction == "Abnormal" else 1 - abnormal_prob,
                4,
            ),
            "model_version": MODEL_VERSION,
        }


xray_service = XRayInferenceService()
