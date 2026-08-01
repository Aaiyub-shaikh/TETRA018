import re

GSTIN_REGEX = re.compile(
    r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$'
)

VALID_STATE_CODES = {
    "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
    "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
    "31", "32", "33", "34", "35", "36", "37", "38", "97", "99"
}

def validate_gstin_format(gstin: str) -> dict:
    if not gstin:
        return {"valid": False, "reason": "GSTIN is empty"}

    gstin = gstin.strip().upper()

    if not GSTIN_REGEX.match(gstin):
        return {
            "valid": False,
            "reason": f"GSTIN '{gstin}' does not match the 15-digit format (e.g. 29AAACR5055K1Z5)"
        }

    state_code = gstin[:2]
    if state_code not in VALID_STATE_CODES:
        return {
            "valid": False,
            "reason": f"Invalid state code '{state_code}' in GSTIN"
        }

    return {"valid": True, "reason": "GSTIN format is valid", "state_code": state_code}
