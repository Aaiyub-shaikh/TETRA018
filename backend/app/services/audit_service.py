from typing import Dict, Any, List
from app.repositories.audit_repository import audit_repository
from app.validators.vendor_validator import validate_vendor
from app.validators.ledger_validator import validate_ledger
from app.validators.gst_validator import validate_gstin
from app.validators.duplicate_validator import validate_duplicates
from app.validators.risk_score import evaluate_risk
from app.services.gemini_service import generate_ai_explanation

def audit_invoice(invoice_number: str) -> Dict[str, Any]:
    """
    Audits an invoice by its invoice number against MongoDB Atlas.
    """
    invoice = audit_repository.get_invoice_by_number(invoice_number)

    if not invoice:
        return {
            "success": False,
            "message": f"Invoice '{invoice_number}' not found in database",
            "data": None
        }

    return process_invoice_audit(invoice)

def process_invoice_audit(invoice: Dict[str, Any]) -> Dict[str, Any]:
    """
    Core engine logic for processing an invoice dictionary.
    """
    invoice_number = invoice.get("invoiceNumber", "")
    vendor_name = invoice.get("vendorName", "")
    gstin = invoice.get("gstin", "")
    total_amount = invoice.get("totalAmount")

    # 1. Fetch Vendor Master, Purchase Ledger, and Duplicates
    vendor = audit_repository.get_vendor_by_name(vendor_name)
    ledger = audit_repository.get_ledger_by_invoice_number(invoice_number)
    duplicates = audit_repository.find_duplicate_invoices(invoice_number, gstin, total_amount)

    # 2. Run Individual Validation Modules
    vendor_issues = validate_vendor(invoice, vendor)
    ledger_issues = validate_ledger(invoice, ledger)
    gst_issues = validate_gstin(invoice)
    duplicate_issues = validate_duplicates(duplicates)

    all_issues = vendor_issues + ledger_issues + gst_issues + duplicate_issues

    # 3. Compute Checks Status Summary for Frontend Badges
    checks = [
        {"name": "Vendor Validation", "status": "FAIL" if vendor_issues else "PASS"},
        {"name": "GST Validation", "status": "FAIL" if gst_issues else "PASS"},
        {"name": "Ledger Match", "status": "FAIL" if ledger_issues else "PASS"},
        {"name": "Duplicate Check", "status": "FAIL" if duplicate_issues else "PASS"}
    ]

    # 4. Compute Weighted Risk Score, Risk Level & Confidence
    risk_score, risk_level, confidence = evaluate_risk(invoice, all_issues)

    # 5. Generate Headline Summary & Forensic AI Explanation via Gemini
    risk_summary, gemini_analysis, recommendations = generate_ai_explanation(
        invoice=invoice,
        issues=all_issues,
        risk_score=risk_score,
        risk_level=risk_level
    )

    # 6. Assemble Dashboard-Ready & Standard Payload
    audit_payload = {
        "invoiceNumber": invoice_number,
        "vendorName": vendor_name,
        "gstin": gstin,
        "invoiceDate": invoice.get("invoiceDate"),
        "totalAmount": total_amount,
        
        # Dashboard-ready nested risk object
        "risk": {
            "score": risk_score,
            "level": risk_level,
            "confidence": confidence
        },
        "risk_summary": risk_summary,
        "gemini_analysis": gemini_analysis,
        "recommendations": recommendations,
        "summary": risk_summary,
        "aiExplanation": gemini_analysis,
        "checks": checks,
        "issues": all_issues,

        # Flat fields for backward compatibility
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "confidence": confidence
    }

    # 7. Persist to MongoDB audit_results collection
    saved_result = audit_repository.save_audit_result(audit_payload)

    return {
        "success": True,
        "message": f"Invoice audit completed. Risk Level: {risk_level} ({risk_score}/100) - Confidence: {confidence}%",
        "data": saved_result
    }