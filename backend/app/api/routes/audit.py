from fastapi import APIRouter, HTTPException, Path
from typing import Dict, Any
from app.services.audit_service import audit_invoice, process_invoice_audit
from app.schemas.audit_schema import AuditResponse, DirectAuditRequest

router = APIRouter(prefix="/api/v1/audit", tags=["Invoice Risk Audit Engine"])

@router.get("/{invoice_number}", response_model=AuditResponse, summary="Audit invoice by Invoice Number")
def audit_by_number(invoice_number: str = Path(..., description="The unique invoice number to audit")):
    """
    Reads extracted invoice data from MongoDBAtlas, compares against Vendor Master and Purchase Ledger,
    detects anomalies, computes risk score, generates a Gemini AI explanation, and persists the audit result.
    """
    result = audit_invoice(invoice_number)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("message", "Invoice not found"))
    return result

@router.post("", response_model=AuditResponse, summary="Audit raw invoice payload")
def audit_direct(payload: DirectAuditRequest):
    """
    Allows auditing an invoice payload directly without prior MongoDB invoice creation.
    """
    invoice_dict = payload.model_dump()
    result = process_invoice_audit(invoice_dict)
    return result