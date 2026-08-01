import re

def extract_vendor_name(text: str) -> str:
    """
    Attempts to extract vendor/company name from common invoice header patterns.
    Uses horizontal spaces instead of newlines to avoid capturing subsequent fields.
    """
    # Pattern 1: "From:", "Seller:", or "Vendor:" label
    match = re.search(r'(?:From|Seller|Vendor)[: \t]+([^\n]+)', text, re.IGNORECASE)
    if match:
        name = match.group(1).strip()
        # Prevent capturing GSTIN or other labels on the same line
        name = re.split(r'\b(?:GSTIN|GST|TIN|PAN|CIN|Email|Phone|Mobile|Contact|Address|Page|Date|Invoice)\b', name, flags=re.IGNORECASE)[0]
        name = re.sub(r'[:\-\s,]+$', '', name).strip()
        if name:
            return name

    # Pattern 2: Word/phrase ending in Pvt Ltd / Limited
    match = re.search(
        r'([A-Z][A-Za-z0-9 \t&.,()\-]{3,60}'
        r'(?:Pvt\.?[ \t]*Ltd\.?|Private[ \t]+Limited|Limited|LLP|Inc\.?|Corp\.?))',
        text
    )
    if match:
        return match.group(0).strip()

    # Pattern 3: First non-empty uppercase line
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines[:5]:
        if re.match(r'^[A-Z0-9][A-Z0-9 \t&]{3,}$', line):
            # Exclude tax invoice header terms
            if not any(term in line.lower() for term in ["tax invoice", "original", "recipient", "invoice"]):
                return line

    return ""
