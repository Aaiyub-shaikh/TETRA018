import os
import logging
from app.core.config import settings

logger = logging.getLogger("app.ocr")

class OCRService:
    def __init__(self):
        self._ocr = None  # Lazy-loaded on first use
        self._ocr_available = None  # None = not tried yet

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
            logger.warning(f"PaddleOCR unavailable: {e}. Falling back to digital-text-only extraction.")
        return self._ocr

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
        """Run PaddleOCR on an image file. Returns empty string if OCR unavailable."""
        ocr = self._get_ocr()
        if ocr is None:
            logger.warning("PaddleOCR not available; returning empty text for image.")
            return ""
        try:
            import cv2
            img = cv2.imread(image_path)
            if img is None:
                logger.error(f"Could not read image: {image_path}")
                return ""
            result = ocr.ocr(image_path, cls=True)
            if not result or not result[0]:
                return ""
            return "\n".join(line[1][0] for line in result[0])
        except Exception as e:
            logger.error(f"PaddleOCR inference error: {e}")
            return ""

ocr_service = OCRService()
