import re
from app.services.extractor.date_extractor import extract_date
from app.services.extractor.invoice_number_extractor import extract_invoice_number
from app.services.extractor.gst_extractor import extract_gstins
from app.services.extractor.amount_extractor import extract_amounts
from app.services.extractor.vendor_extractor import extract_vendor_name

def extract_all_fields(text: str) -> dict:
    """Master extractor: runs all extractors and returns a consolidated result."""
    gst_data = extract_gstins(text)
    amount_data = extract_amounts(text)

    return {
        "invoice_number": extract_invoice_number(text),
        "date": extract_date(text),
        "vendor_gstin": gst_data.get("vendor_gstin"),
        "customer_gstin": gst_data.get("customer_gstin"),
        "all_gstins": gst_data.get("all_gstins", []),
        "vendor_name": extract_vendor_name(text),
        "taxable_amount": amount_data.get("taxable_amount", 0.0),
        "tax_amount": amount_data.get("tax_amount", 0.0),
        "total_amount": amount_data.get("total_amount", 0.0),
        "place_of_supply": extract_place_of_supply(text),
    }

def extract_place_of_supply(text: str) -> str:
    match = re.search(r'Place\s+of\s+Supply[:\s]+([^\n]+)', text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return ""
