from typing import Dict, Any, List, Optional

def validate_ledger(invoice: Dict[str, Any], ledger: Optional[Dict[str, Any]]) -> List[Dict[str, str]]:
    issues = []

    if ledger is None:
        issues.append({
            "field": "invoiceNumber",
            "message": f"Invoice '{invoice.get('invoiceNumber')}' missing in Purchase Ledger",
            "severity": "High"
        })
        return issues

    inv_date = str(invoice.get("invoiceDate", "")).strip()
    ledger_date = str(ledger.get("invoiceDate", "") or ledger.get("date", "")).strip()

    if inv_date and ledger_date and inv_date != ledger_date:
        issues.append({
            "field": "invoiceDate",
            "message": f"Invoice date mismatch (Invoice: '{inv_date}' vs Ledger: '{ledger_date}')",
            "severity": "Medium"
        })

    try:
        inv_amt = float(invoice.get("totalAmount", 0))
        ledger_amt = float(ledger.get("amount", 0) or ledger.get("totalAmount", 0))

        if abs(inv_amt - ledger_amt) > 0.01:
            issues.append({
                "field": "totalAmount",
                "message": f"Amount mismatch (Invoice: ₹{inv_amt} vs Ledger: ₹{ledger_amt})",
                "severity": "High"
            })
    except (ValueError, TypeError):
        issues.append({
            "field": "totalAmount",
            "message": "Amount format invalid for numeric comparison",
            "severity": "Medium"
        })

    return issues