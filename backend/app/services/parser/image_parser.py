import os
import logging
import tempfile
from app.services.ocr.paddle_ocr import ocr_service
from app.services.ocr.text_cleaner import clean_ocr_text

logger = logging.getLogger("app.parser.image")

def parse_image(image_path: str) -> dict:
    """
    Runs PaddleOCR on an image file (lazy-loads cv2 + OCR model).
    Returns: {"text": str, "method": str}
    """
    raw_text = ocr_service.extract_text_from_image(image_path)
    cleaned = clean_ocr_text(raw_text)
    return {
        "text": cleaned,
        "method": "paddleocr" if raw_text else "none"
    }
