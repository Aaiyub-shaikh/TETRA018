import logging

logger = logging.getLogger("app.parser.pdf")

def parse_pdf(pdf_path: str) -> dict:
    """
    Extracts raw text and page count from a PDF file.
    Tries pdfplumber first (better for structured PDFs), falls back to PyMuPDF.
    Returns: {"text": str, "page_count": int, "method": str}
    """
    text = ""
    method = "none"
    
    # --- Attempt 1: pdfplumber (best for tabular/structured PDFs) ---
    try:
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            page_count = len(pdf.pages)
            pages_text = []
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    pages_text.append(t)
            text = "\n".join(pages_text)
            if text.strip():
                method = "pdfplumber"
                return {"text": text, "page_count": page_count, "method": method}
    except Exception as e:
        logger.warning(f"pdfplumber failed for {pdf_path}: {e}")

    # --- Attempt 2: PyMuPDF ---
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(pdf_path)
        page_count = len(doc)
        pages_text = [doc[i].get_text("text") for i in range(page_count)]
        text = "\n".join(pages_text)
        method = "pymupdf"
        doc.close()
        return {"text": text, "page_count": page_count, "method": method}
    except Exception as e:
        logger.error(f"PyMuPDF failed for {pdf_path}: {e}")
    
    return {"text": "", "page_count": 0, "method": "none"}
