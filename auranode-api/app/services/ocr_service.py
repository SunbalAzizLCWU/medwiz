import io
import asyncio
import httpx

from app.core.logging_config import logger

_reader = None

def _get_reader():
    global _reader
    if _reader is None:
        import easyocr  # noqa: PLC0415
        logger.info("Initializing EasyOCR reader (English)")
        _reader = easyocr.Reader(["en"], gpu=False, verbose=False)
    return _reader


class OCRService:
    async def extract_text(self, file_url: str) -> str:
        """
        Downloads the image from the given URL and extracts raw text using EasyOCR.
        Returns the raw string for Groq to parse.
        """
        logger.info("Running OCR on lab report: %s", file_url)
        
        # 1. Fetch the image asynchronously
        async with httpx.AsyncClient() as client:
            response = await client.get(file_url, timeout=60.0)
            response.raise_for_status()

        # 2. EasyOCR is CPU heavy and synchronous, so we run it in a thread 
        # to prevent it from freezing your FastAPI server.
        def _read_image():
            reader = _get_reader()
            results = reader.readtext(io.BytesIO(response.content), detail=0)
            return " ".join(results)

        # 3. Extract and return the raw text
        text = await asyncio.to_thread(_read_image)
        logger.info("OCR extraction complete. Text length: %d characters", len(text))
        
        return text
