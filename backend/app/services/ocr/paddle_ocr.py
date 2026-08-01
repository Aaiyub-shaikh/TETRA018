import os
import logging
from app.core.config import settings

logger = logging.getLogger("app.ocr")

TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

class OCRService:
    def __init__(self):
        self._ocr = None  # Lazy-loaded PaddleOCR on first use
        self._ocr_available = None  # None = not tried yet
        self._tesseract_checked = False
        self._tesseract_available = False

    def _get_ocr(self):
        """Lazy-load PaddleOCR on first use so startup is never blocked."""
        if self._ocr_available is False:
            return None
        if self._ocr is not None:
            return self._ocr
        try:
            from paddleocr import PaddleOCR
            self._ocr = PaddleOCR(
                use_angle_cls=True,
                lang="en",
                use_gpu=settings.USE_GPU,
                show_log=False
            )
            self._ocr_available = True
            logger.info("PaddleOCR initialized successfully.")
        except Exception as e:
            self._ocr_available = False
            logger.warning(f"PaddleOCR unavailable: {e}. Will use Tesseract fallback for images.")
        return self._ocr

    def _get_tesseract(self):
        """Check if Tesseract is available and return pytesseract module."""
        if self._tesseract_checked:
            return __import__("pytesseract") if self._tesseract_available else None
        self._tesseract_checked = True
        try:
            import pytesseract
            if os.path.exists(TESSERACT_PATH):
                pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
            # Quick sanity check
            pytesseract.get_tesseract_version()
            self._tesseract_available = True
            logger.info("Tesseract OCR available as fallback.")
        except Exception as e:
            self._tesseract_available = False
            logger.warning(f"Tesseract not available: {e}")
        return __import__("pytesseract") if self._tesseract_available else None

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extracts text from PDF.
        If pdfplumber/PyMuPDF returns selectable text (>= 50 chars), return immediately
        without converting to images or calling OCR.
        Otherwise, converts pages to images in uploads/temp/, runs PaddleOCR, and cleans up.
        """
        # 1. Try pdfplumber first
        try:
            import pdfplumber
            with pdfplumber.open(pdf_path) as pdf:
                pages = [p.extract_text() or "" for p in pdf.pages]
                text = "\n".join(pages)
                if len(text.strip()) >= 50:
                    logger.info("Extracted digital text via pdfplumber (>= 50 chars). Skipping OCR.")
                    return text
        except Exception as e:
            logger.warning(f"pdfplumber digital extraction failed: {e}")

        # 2. Try PyMuPDF as direct fallback for text
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(pdf_path)
            pages = [doc[i].get_text("text") for i in range(len(doc))]
            doc.close()
            text = "\n".join(pages)
            if len(text.strip()) >= 50:
                logger.info("Extracted digital text via PyMuPDF (>= 50 chars). Skipping OCR.")
                return text
        except Exception as e:
            logger.warning(f"PyMuPDF digital extraction failed: {e}")

        # 3. Fallback: PDF is scanned / empty. Render pages to images, run PaddleOCR, and clean up.
        logger.info("PDF has less than 50 chars of selectable text. Launching image OCR fallback...")
        ocr_pages = []
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(pdf_path)
            for i in range(len(doc)):
                pix = doc[i].get_pixmap(dpi=150)
                # Store temporarily under uploads/temp/ (via settings.TEMP_DIR)
                tmp_img_path = os.path.join(settings.TEMP_DIR, f"ocr_page_{i}_{os.path.basename(pdf_path)}.png")
                pix.save(tmp_img_path)
                
                # Extract text
                page_text = self.extract_text_from_image(tmp_img_path)
                ocr_pages.append(page_text)
                
                # Clean up temporary page image
                if os.path.exists(tmp_img_path):
                    try:
                        os.remove(tmp_img_path)
                    except Exception as err:
                        logger.error(f"Failed to delete temp page image {tmp_img_path}: {err}")
            doc.close()
        except Exception as e:
            logger.error(f"Scanned PDF rendering or OCR failed: {e}")

        return "\n".join(ocr_pages)

    def extract_text_from_image(self, image_path: str) -> str:
        """Run OCR on an image file. Tries PaddleOCR first, then Tesseract fallback."""
        # Try PaddleOCR first
        ocr = self._get_ocr()
        if ocr is not None:
            try:
                result = ocr.ocr(image_path, cls=True)
                if result and result[0]:
                    text = "\n".join(line[1][0] for line in result[0])
                    if len(text.strip()) > 10:
                        return text
            except Exception as e:
                logger.warning(f"PaddleOCR inference error: {e}")

        # Fallback to Tesseract
        pytesseract = self._get_tesseract()
        if pytesseract is not None:
            try:
                from PIL import Image
                img = Image.open(image_path)
                text = pytesseract.image_to_string(img, lang="eng")
                if text and text.strip():
                    logger.info("Used Tesseract fallback for image OCR.")
                    return text.strip()
            except Exception as e:
                logger.error(f"Tesseract OCR error: {e}")

        logger.warning("No OCR engine available; returning empty text for image.")
        return ""

ocr_service = OCRService()
