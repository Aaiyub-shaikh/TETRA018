import os
import logging
from app.services.parser.pdf_parser import parse_pdf
from app.services.parser.image_parser import parse_image
from app.services.parser.csv_parser import parse_csv
from app.services.ocr.paddle_ocr import ocr_service
from app.services.ocr.text_cleaner import clean_ocr_text
from app.services.extractor.field_extractor import extract_all_fields

logger = logging.getLogger("app.parser.invoice")

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}
PDF_EXTENSION = ".pdf"
CSV_EXTENSION = ".csv"

def parse_invoice(file_path: str) -> dict:
    """
    Master invoice parser. Detects file type, runs the correct parser,
    cleans the text, extracts all fields, and returns a unified result.
    """
    ext = os.path.splitext(file_path)[1].lower()
    raw_text = ""
    method = "none"
    page_count = 1

    if ext == CSV_EXTENSION:
        logger.info(f"Parsing CSV: {file_path}")
        result = parse_csv(file_path)
        if not result.get("success"):
            return {
                "success": False,
                "error": result.get("error", "Failed to parse CSV"),
                "raw_text": "",
                "fields": {}
            }
        # CSV returns structured fields directly — no OCR needed
        return {
            "success": True,
            "raw_text": f"CSV import: {os.path.basename(file_path)}",
            "page_count": 1,
            "extraction_method": "csv",
            "fields": result.get("fields", {})
        }

    elif ext == PDF_EXTENSION:
        logger.info(f"Parsing PDF: {file_path}")
        result = parse_pdf(file_path)
        raw_text = result.get("text", "")
        method = result.get("method", "none")
        page_count = result.get("page_count", 1)

        # If digital text is empty, it's a scanned PDF — run OCR
        if not raw_text.strip():
            logger.info("Digital PDF has no extractable text. Running OCR pipeline.")
            raw_text = ocr_service.extract_text_from_pdf(file_path)
            method = "paddleocr_pdf"

    elif ext in IMAGE_EXTENSIONS:
        logger.info(f"Parsing Image: {file_path}")
        result = parse_image(file_path)
        raw_text = result.get("text", "")
        method = result.get("method", "none")

    else:
        logger.error(f"Unsupported file type: {ext}")
        return {
            "success": False,
            "error": f"Unsupported file type: {ext}",
            "raw_text": "",
            "fields": {}
        }

    # Clean extracted text
    cleaned_text = clean_ocr_text(raw_text)
    
    # Extract structured fields
    fields = extract_all_fields(cleaned_text)

    return {
        "success": True,
        "raw_text": cleaned_text,
        "page_count": page_count,
        "extraction_method": method,
        "fields": fields
    }
