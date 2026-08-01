import re

DATE_PATTERNS = [
    # 20-Jul-2026 or 20 Jul 2026 or 20-July-2026
    r'\d{1,2}[-\/\s]+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[-\/\s]+\d{2,4}',
    # Jul 20, 2026 or July 20, 2026
    r'(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[-\/\s]+\d{1,2},?[-\/\s]+\d{2,4}',
    # 20/07/2026 or 20-07-2026
    r'\d{1,2}[-\/\s]+\d{1,2}[-\/\s]+\d{2,4}',
    # 2026-07-20
    r'\d{4}[-\/\s]+\d{1,2}[-\/\s]+\d{1,2}',
]

def extract_date(text: str) -> str:
    """Extracts invoice date from text using multiple date format patterns."""
    # Try finding labelled dates first
    labelled_match = re.search(
        r'(?:Invoice\s+Date|Date)[:\s\-]+(' + '|'.join(DATE_PATTERNS) + ')',
        text, re.IGNORECASE
    )
    if labelled_match:
        return labelled_match.group(1).strip()

    # Fallback: find any date pattern in the text
    for pattern in DATE_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(0).strip()

    return ""