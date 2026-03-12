import io
import logging
import os
import gc  # Added for manual memory management
import httpx
import numpy as np
import onnxruntime as ort
from PIL import Image
from app.core.config import settings

# ImageNet constants for preprocessing
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
INPUT_SIZE = 224
MODEL_VERSION = "v1.0"

def softmax(x: np.ndarray) -> np.ndarray:
    """Compute softmax values for each sets of scores in x."""
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()

class XRayInferenceService:
    def __init__(self):
        self.session = None
        self.model_path = settings.MODEL_CACHE_PATH
        self.logger = logging.getLogger("auranode.xray")

    async def ensure_model_loaded(self):
        """Download ONNX model and initialize session with ULTRA-LOW MEMORY settings."""
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

        # --- MEMORY OPTIMIZATIONS FOR RENDER FREE TIER ---
        options = ort.SessionOptions()
        
        # 1. Disable all optimizations to save upfront RAM allocation
        options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_DISABLE_ALL
        
        # 2. Force sequential execution to prevent thread-pool memory overhead
        options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        
        # 3. Restrict threading to minimum
        options.intra_op_num_threads = 1
        options.inter_op_num_threads = 1
        
        try:
            self.session = ort.InferenceSession(
                self.model_path,
                sess_options=options,
                providers=["CPUExecutionProvider"],
            )
            self.logger.info("Memory-optimized ONNX session initialized.")
        except Exception as e:
            self.logger.error(f"Failed to initialize ONNX session: {e}")
            raise e

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
        img_array = np.expand_dims(img_array, axis=0)   # Add batch dimension
        
        # Explicitly return float32 to match ONNX expected input
        return img_array.astype(np.float32)

    async def predict(self, image_bytes: bytes) -> dict:
        """Run inference with manual garbage collection to prevent OOM crashes."""
        await self.ensure_model_loaded()
        
        # 1. Preprocess and capture input name
        input_tensor = self.preprocess_image(image_bytes)
        input_name = self.session.get_inputs()[0].name
        
        try:
            # 2. Run Inference
            outputs = self.session.run(None, {input_name: input_tensor})
            
            # 3. CRITICAL: Manual memory cleanup
            # We delete the heavy input tensor immediately after use
            del input_tensor
            gc.collect()  # Force Python to release RAM to Render
            
            # 4. Process Results
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
        except Exception as e:
            self.logger.error(f"Inference prediction failed: {e}")
            # Ensure cleanup even on failure
            if 'input_tensor' in locals():
                del input_tensor
            gc.collect()
            raise e

# Global service instance
xray_service = XRayInferenceService()
