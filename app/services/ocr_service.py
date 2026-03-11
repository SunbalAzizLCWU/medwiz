import io
import logging
import re

import easyocr
from PIL import Image


class OCRService:
    def __init__(self):
        self.reader = None  # lazy init to save memory
        self.logger = logging.getLogger("auranode.ocr")

    def ensure_initialized(self):
        """Lazy-init EasyOCR reader."""
        if self.reader is None:
            self.logger.info("Initializing EasyOCR reader...")
            self.reader = easyocr.Reader(
                ["en"],  # English only — add 'ur' if Urdu support needed
                gpu=False,
                verbose=False,
            )
            self.logger.info("EasyOCR ready.")

    def extract_text(self, image_bytes: bytes) -> str:
        """Extract all text from image. Returns cleaned string."""
        self.ensure_initialized()
        image = Image.open(io.BytesIO(image_bytes))
        results = self.reader.readtext(
            image,
            detail=0,       # return text strings only
            paragraph=True, # merge nearby text into paragraphs
        )
        raw_text = " ".join(results)
        # Clean: remove excessive whitespace and non-printable chars
        cleaned = re.sub(r"\s+", " ", raw_text).strip()
        self.logger.debug(f"OCR extracted {len(cleaned)} characters.")
        return cleaned


ocr_service = OCRService()
