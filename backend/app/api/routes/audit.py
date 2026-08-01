from fastapi import APIRouter, HTTPException, Path
from typing import Dict, Any
from app.services.audit_service import audit_invoice, process_invoice_audit
from app.schemas.audit_schema import AuditResponse, DirectAuditRequest
from app.database.mongodb import get_database

router = APIRouter()

@router.get("", summary="Get audit logs from MongoDB")
async def get_audit_trail(
    limit: int = 50,
    search: str = None,
    severity: str = None
):
    """
    Returns recent audit execution records stored in the audit_results collection.
    """
    db = get_database()
    if db is None:
        return {"events": [], "total": 0}
    try:
        query = {}
        
        # 1. Severity filter
        if severity and severity != "ALL":
            # Map frontend severities to riskLevel/severity in audit logs
            query["$or"] = [
                {"riskLevel": severity},
                {"risk.risk_level": severity},
                {"severity": severity}
            ]
            
        # 2. Search term
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            query["$or"] = query.get("$or", []) + [
                {"filename": search_regex},
                {"invoiceNumber": search_regex},
                {"raw_text": search_regex},
                {"issues": search_regex},
                {"status": search_regex},
                {"action": search_regex},
                {"details": search_regex},
                {"user": search_regex}
            ]
            # Clean up empty $or list if search didn't match anything
            if not query["$or"]:
                query.pop("$or")

        cursor = db["audit_results"].find(query).sort("timestamp", -1).limit(limit)
        events = await cursor.to_list(length=limit)
        
        # Format events to have standardized fields
        formatted_events = []
        for ev in events:
            # Map ObjectId to string
            if "_id" in ev:
                ev["_id"] = str(ev["_id"])
            
            # Map to standard AuditEvent fields if not present
            invoice_no = ev.get("invoiceNumber") or ev.get("extracted_fields", {}).get("invoice_number") or "N/A"
            risk_level = ev.get("riskLevel") or ev.get("risk", {}).get("risk_level") or "Low"
            score = ev.get("riskScore") or ev.get("risk", {}).get("risk_score") or 0
            
            # Determine severity
            sev = ev.get("severity")
            if not sev:
                if risk_level == "High" or risk_level == "Critical":
                    sev = "Critical"
                elif risk_level == "Medium":
                    sev = "Warning"
                else:
                    sev = "Info"
            
            # Determine action & details
            action = ev.get("action")
            details = ev.get("details")
            if not action:
                issues = ev.get("issues") or []
                exceptions = ev.get("exceptions") or []
                checks = [ex.get("check") for ex in exceptions if isinstance(ex, dict)] if exceptions else []
                
                if issues or checks:
                    action = "Anomaly Flags Raised"
                    all_issues = list(issues) + list(checks)
                    details = f"Anomaly detected: {', '.join(all_issues)} on invoice {invoice_no}."
                else:
                    action = "Invoice Analyzed"
                    conf = ev.get("confidence") or ev.get("risk", {}).get("confidence") or 100.0
                    details = f"OCR extraction completed for {ev.get('filename','invoice')}. Confidence: {conf:.1f}%. Risk score: {score}%."

            formatted_events.append({
                "id": ev.get("_id"),
                "timestamp": ev.get("timestamp") or ev.get("auditedAt") or "",
                "action": action,
                "user": ev.get("user") or "AI Engine",
                "targetType": ev.get("targetType") or "Invoice",
                "targetId": invoice_no,
                "details": details,
                "severity": sev
            })

        return {"events": formatted_events, "total": len(formatted_events)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")

@router.get("/{invoice_number}", response_model=AuditResponse, summary="Audit invoice by Invoice Number")
def audit_by_number(invoice_number: str = Path(..., description="The unique invoice number to audit")):
    """
    Reads extracted invoice data from MongoDB Atlas, compares against Vendor Master and Purchase Ledger,
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
