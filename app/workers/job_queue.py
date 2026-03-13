import io
import logging
import re
from PIL import Image
import pytesseract

class OCRService:
    def __init__(self):
        self.logger = logging.getLogger("auranode.ocr")
        self.logger.info("Initializing lightweight Tesseract OCR service...")

    def extract_text(self, image_bytes: bytes) -> str:
        """Extract all text from image using Tesseract. Returns cleaned string."""
        try:
            # Convert raw bytes to a PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Tesseract extracts the text block instantly
            self.logger.info("Running PyTesseract extraction...")
            raw_text = pytesseract.image_to_string(image)
            
            # Clean: remove excessive whitespace and non-printable chars
            cleaned = re.sub(r"\s+", " ", raw_text).strip()
            
            self.logger.debug(f"OCR extracted {len(cleaned)} characters.")
            return cleaned
            
        except Exception as e:
            self.logger.error(f"OCR Extraction Failed: {e}")
            raise Exception("Failed to read text from the image.")

ocr_service = OCRService()
