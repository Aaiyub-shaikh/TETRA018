import re
from typing import Dict, Any, List

GST_REGEX = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$"

def validate_gstin(invoice: Dict[str, Any]) -> List[Dict[str, str]]:
    gstin = invoice.get("gstin", "")
    if not gstin:
        return [{
            "field": "gstin",
            "message": "GSTIN is missing on invoice",
            "severity": "High"
        }]

    if re.match(GST_REGEX, str(gstin).strip()):
        return []

    return [{
        "field": "gstin",
        "message": f"Invalid GSTIN format: '{gstin}'",
        "severity": "High"
    }]