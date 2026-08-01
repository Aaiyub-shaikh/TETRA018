import re


def extract_invoice_number(text):

    patterns = [
        r'Invoice\s*No[:\s]*([A-Z0-9\-]+)',
        r'Invoice\s*Number[:\s]*([A-Z0-9\-]+)',
        r'INV[-]?\d+'
    ]


    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE
        )

        if match:

            if match.groups():
                return match.group(1)

            return match.group()

    return None