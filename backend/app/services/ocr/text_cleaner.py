import re

def clean_ocr_text(text: str) -> str:
    """
    Cleans raw OCR output:
    - Removes excessive whitespace
    - Fixes common OCR mis-reads
    - Normalises currency symbols
    """
    if not text:
        return ""

    # Normalise line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')

    # Remove null characters and non-printable chars (except newline and tab)
    text = re.sub(r'[^\x20-\x7E\n₹]', ' ', text)

    # Normalise currency: Rs, RS, rs -> ₹
    text = re.sub(r'\bRs\.?\b', '₹', text, flags=re.IGNORECASE)
    text = re.sub(r'\bINR\b', '₹', text, flags=re.IGNORECASE)

    # Collapse runs of spaces
    text = re.sub(r'[ \t]+', ' ', text)

    # Collapse blank lines > 2
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text.strip()
