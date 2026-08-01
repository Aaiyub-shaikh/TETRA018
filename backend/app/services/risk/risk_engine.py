from app.services.risk.scoring import compute_risk_score
from app.services.risk.anomaly_detector import detect_anomalies
from app.services.validation.gst_validator import validate_gstin_format
from app.services.validation.duplicate_checker import check_duplicate
from app.services.validation.amount_checker import check_amount
from app.services.validation.date_checker import check_date, parse_date_str
from app.services.validation.vendor_checker import check_vendor
from app.services.validation.ledger_checker import check_ledger
import logging

logger = logging.getLogger("app.risk")

async def run_risk_engine(fields: dict) -> dict:
    """
    Runs all validators and anomaly detectors, then aggregates risk score.
    Queries MongoDB Atlas as the single source of truth.
    """
    invoice_number = fields.get("invoice_number", "")
    vendor_gstin = fields.get("vendor_gstin", "")
    vendor_name = fields.get("vendor_name", "")
    taxable_amount = fields.get("taxable_amount", 0.0)
    tax_amount = fields.get("tax_amount", 0.0)
    total_amount = fields.get("total_amount", 0.0)
    invoice_date = fields.get("date", "")

    flags = []

    # 1. GSTIN format validation
    gst_result = validate_gstin_format(vendor_gstin)
    if not gst_result["valid"]:
        flags.append({
            "check": "GST Validation",
            "severity": "High",
            "detail": gst_result["reason"]
        })

    # 2. Duplicate check (queries MongoDB)
    dup_result = await check_duplicate(invoice_number)
    if dup_result["is_duplicate"]:
        flags.append({
            "check": "Duplicate Invoice",
            "severity": "High",
            "detail": dup_result["reason"]
        })

    # 3. Internal amount consistency check
    amt_result = check_amount(taxable_amount, tax_amount, total_amount)
    if not amt_result["valid"]:
        flags.append({
            "check": "Amount Mismatch",
            "severity": "Medium",
            "detail": amt_result["reason"]
        })

    # 4. Internal date validity check
    date_result = check_date(invoice_date)
    if not date_result["valid"]:
        flags.append({
            "check": "Date Anomaly",
            "severity": "Medium",
            "detail": date_result["reason"]
        })

    # 5. Vendor validation (queries MongoDB)
    vendor_result = await check_vendor(vendor_name, vendor_gstin)
    if not vendor_result["valid"]:
        flags.append({
            "check": "Vendor Verification",
            "severity": "Medium",
            "detail": vendor_result["reason"]
        })

    # 6. Ledger reconciliation and comparisons (queries MongoDB)
    ledger_result = await check_ledger(invoice_number)
    if ledger_result["found"]:
        ledger_doc = ledger_result["document"]
        
        # Compare Invoice Total with purchase_ledger.total_amount
        ledger_total = ledger_doc.get("total_amount") or ledger_doc.get("amount", 0.0)
        try:
            ledger_total_val = float(ledger_total)
        except (ValueError, TypeError):
            ledger_total_val = 0.0
            
        total_diff = abs(total_amount - ledger_total_val)
        if total_diff > 1.0:  # Tolerance of 1.0 rupee
            flags.append({
                "check": "Amount Mismatch",
                "severity": "High",
                "detail": f"Ledger amount mismatch: invoice total is ₹{total_amount:.2f} but purchase ledger states ₹{ledger_total_val:.2f}"
            })
            
        # Compare Invoice Date with purchase_ledger.invoice_date (check both camelCase and snake_case)
        ledger_date = ledger_doc.get("invoiceDate") or ledger_doc.get("invoice_date") or ledger_doc.get("date", "")
        parsed_inv_date = parse_date_str(invoice_date)
        parsed_led_date = parse_date_str(str(ledger_date))
        
        if parsed_inv_date and parsed_led_date:
            if parsed_inv_date != parsed_led_date:
                flags.append({
                    "check": "Date Anomaly",
                    "severity": "High",
                    "detail": f"Ledger date mismatch: invoice date is {parsed_inv_date} but purchase ledger states {parsed_led_date}"
                })
        elif str(invoice_date).strip() != str(ledger_date).strip():
            flags.append({
                "check": "Date Anomaly",
                "severity": "High",
                "detail": f"Ledger date mismatch: invoice date '{invoice_date}' does not match purchase ledger date '{ledger_date}'"
            })
    else:
        flags.append({
            "check": "Ledger Missing",
            "severity": "Medium",
            "detail": ledger_result["reason"]
        })

    # 7. Anomaly detection (statistical / pattern-based)
    anomalies = detect_anomalies(fields)
    flags.extend(anomalies)

    # Compute final risk score
    risk_score, risk_level, confidence = compute_risk_score(flags)

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "confidence": confidence,
        "flags": flags,
        "flag_count": len(flags),
        "validation_details": {
            "gst": gst_result,
            "duplicate": dup_result,
            "amount": amt_result,
            "date": date_result,
            "vendor": vendor_result,
            "ledger": ledger_result,
        }
    }
