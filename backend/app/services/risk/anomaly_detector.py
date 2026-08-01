import re

# Round-number amounts (e.g. 100000, 50000) are a common fraud signal
def _is_round_number(amount: float) -> bool:
    return amount > 0 and amount % 1000 == 0

def detect_anomalies(fields: dict) -> list:
    """
    Detects statistical and pattern-based anomalies in extracted invoice fields.
    Returns a list of flag dicts.
    """
    anomalies = []
    total = fields.get("total_amount", 0.0)
    invoice_number = fields.get("invoice_number", "") or ""
    vendor_gstin = fields.get("vendor_gstin", "") or ""
    vendor_name = fields.get("vendor_name", "") or ""

    # 1. Suspiciously round total amount
    if _is_round_number(total) and total > 10000:
        anomalies.append({
            "check": "Round Amount",
            "severity": "Low",
            "detail": f"Invoice total ₹{total:,.2f} is a suspiciously round number — manual review advised"
        })

    # 2. Missing invoice number
    if not invoice_number.strip():
        anomalies.append({
            "check": "Missing Invoice Number",
            "severity": "High",
            "detail": "Invoice number could not be extracted from the document"
        })

    # 3. Missing GSTIN on invoice
    if not vendor_gstin.strip():
        anomalies.append({
            "check": "Missing GSTIN",
            "severity": "High",
            "detail": "Vendor GSTIN not found on invoice — possibly unregistered or fraudulent vendor"
        })

    # 4. Vendor name is all numbers / gibberish
    if vendor_name and re.match(r'^[\d\s]+$', vendor_name.strip()):
        anomalies.append({
            "check": "Invalid Vendor Name",
            "severity": "Medium",
            "detail": f"Vendor name '{vendor_name}' appears to be numeric/invalid"
        })

    # 5. Very high-value invoice without GSTIN
    if total > 200000 and not vendor_gstin.strip():
        anomalies.append({
            "check": "High Value Unregistered",
            "severity": "Critical",
            "detail": f"Invoice value ₹{total:,.2f} exceeds ₹2L threshold with no valid GSTIN"
        })

    return anomalies
