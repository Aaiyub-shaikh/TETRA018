from typing import Dict, Any, List, Optional

def validate_vendor(invoice: Dict[str, Any], vendor: Optional[Dict[str, Any]]) -> List[Dict[str, str]]:
    issues = []

    if vendor is None:
        issues.append({
            "field": "vendorName",
            "message": f"Vendor '{invoice.get('vendorName', 'Unknown')}' not found in Vendor Master",
            "severity": "High"
        })
        return issues

    inv_vendor_name = str(invoice.get("vendorName", "")).strip().lower()
    master_vendor_name = str(vendor.get("vendorName", "")).strip().lower()

    if inv_vendor_name != master_vendor_name:
        issues.append({
            "field": "vendorName",
            "message": f"Vendor name mismatch (Invoice: '{invoice.get('vendorName')}' vs Master: '{vendor.get('vendorName')}')",
            "severity": "High"
        })

    inv_gstin = str(invoice.get("gstin", "")).strip().upper()
    master_gstin = str(vendor.get("gstin", "")).strip().upper()

    if inv_gstin and master_gstin and inv_gstin != master_gstin:
        issues.append({
            "field": "gstin",
            "message": f"Vendor GSTIN mismatch (Invoice: '{invoice.get('gstin')}' vs Master: '{vendor.get('gstin')}')",
            "severity": "High"
        })

    vendor_status = str(vendor.get("status", "Active")).strip().lower()
    if vendor_status != "active":
        issues.append({
            "field": "status",
            "message": f"Vendor account is {vendor.get('status', 'Inactive')}",
            "severity": "Medium"
        })

    return issues