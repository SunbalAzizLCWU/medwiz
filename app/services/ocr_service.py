import logging
import fitz  # PyMuPDF

class OCRService:
    def __init__(self):
        self.logger = logging.getLogger("auranode.ocr")
        self.logger.info("Initializing lightweight PyMuPDF text extractor...")

    def extract_text(self, file_bytes: bytes) -> str:
        """Extract all text natively from a document."""
        try:
            self.logger.info("Running PyMuPDF extraction...")
            
            # Read the PDF natively from bytes
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            
            text = ""
            for page in doc:
                text += page.get_text("text")
                
            # Clean up whitespace
            cleaned = " ".join(text.split()).strip()
            self.logger.debug(f"Extracted {len(cleaned)} characters.")
            
            if not cleaned:
                self.logger.warning("No text found. If this is an image file, it requires a Vision model.")
                return "No readable text found in this document."
                
            return cleaned
            
        except Exception as e:
            self.logger.error(f"Text Extraction Failed: {e}")
            raise Exception("Failed to read text from the document. Ensure it is a valid PDF.")

ocr_service = OCRService()
