import os
import json
import logging
from typing import Any, Dict, List, Optional
from app.core.config import settings

logger = logging.getLogger("app.gemini")


def generate_risk_explanations(
    invoice: Dict[str, Any],
    flags: List[Dict[str, Any]],
    risk_score: float,
    risk_level: str,
    validation_details: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Generate detailed explanations for each detected risk flag using Gemini.
    Returns a list of explanation dicts, one per flag.
    Falls back to rule-based explanations if Gemini fails.
    """
    api_key = getattr(settings, "GEMINI_API_KEY", os.getenv("GEMINI_API_KEY", ""))

    if not flags:
        return []

    invoice_number = (
        invoice.get("invoice_number")
        or invoice.get("invoiceNumber")
        or invoice.get("invoiceNo")
        or "N/A"
    )
    vendor_name = (
        invoice.get("vendor_name")
        or invoice.get("vendor")
        or invoice.get("vendorName")
        or "N/A"
    )
    vendor_gstin = (
        invoice.get("vendor_gstin")
        or invoice.get("gstin")
        or "N/A"
    )
    total_amount = (
        invoice.get("total_amount")
        or invoice.get("total")
        or invoice.get("totalAmount")
        or 0.0
    )
    invoice_date = (
        invoice.get("date")
        or invoice.get("invoiceDate")
        or invoice.get("invoice_date")
        or "N/A"
    )

    if not api_key:
        return _fallback_explanations(flags, validation_details)

    flags_payload = []
    for f in flags:
        entry = {
            "check": f.get("check", "Unknown"),
            "severity": f.get("severity", "Medium"),
            "detail": f.get("detail", ""),
        }
        flags_payload.append(entry)

    payload = {
        "invoiceNumber": invoice_number,
        "vendorName": vendor_name,
        "vendorGSTIN": vendor_gstin,
        "totalAmount": total_amount,
        "invoiceDate": invoice_date,
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "flags": flags_payload,
    }

    if validation_details:
        payload["validationDetails"] = {}
        for key, val in validation_details.items():
            if isinstance(val, dict):
                payload["validationDetails"][key] = {
                    k: v for k, v in val.items()
                    if k in ("valid", "reason", "is_duplicate", "found", "existing_date", "existing_amount", "ledger_date", "ledger_amount")
                }

    prompt = f"""You are a forensic auditor explaining each risk anomaly found on an invoice.

Invoice Data:
{json.dumps(payload, indent=2)}

For EACH flag in the "flags" array, generate a detailed explanation. Your response must be a JSON array of objects. Each object must have exactly these keys:

1. "type": The check name (e.g., "Duplicate Invoice", "GST Invalid", "Amount Mismatch", "Date Mismatch", "Vendor Missing", "Ledger Missing")
2. "severity": "High", "Medium", or "Low"
3. "reason": A clear explanation of WHY this flag was triggered, referencing specific data from the invoice.
4. "impact": What financial or compliance risk this creates.
5. "recommendation": A specific actionable next step.
6. "evidence": Supporting data points (e.g., "Invoice amount: ₹52,000 vs Ledger amount: ₹47,000"). If not applicable, use "".

Return ONLY the raw JSON array. Do NOT include markdown code fences.
"""

    try:
        # Try google-genai SDK
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            for model_name in ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    if response and response.text:
                        parsed = _parse_explanations(response.text)
                        if parsed and len(parsed) == len(flags):
                            return parsed
                except Exception:
                    continue
        except Exception:
            pass

        # Try google-generativeai SDK
        try:
            import google.generativeai as ggenai
            ggenai.configure(api_key=api_key)
            for model_name in ["gemini-1.5-flash-latest", "gemini-2.0-flash", "gemini-pro"]:
                try:
                    model = ggenai.GenerativeModel(model_name)
                    response = model.generate_content(prompt)
                    if response and response.text:
                        parsed = _parse_explanations(response.text)
                        if parsed and len(parsed) == len(flags):
                            return parsed
                except Exception:
                    continue
        except Exception:
            pass

    except Exception as e:
        logger.warning(f"Gemini risk explanation generation failed: {e}")

    return _fallback_explanations(flags, validation_details)


def _parse_explanations(text: str) -> Optional[List[Dict[str, str]]]:
    """Parse Gemini JSON response into list of explanation dicts."""
    try:
        clean = text.strip()
        if clean.startswith("```json"):
            clean = clean[7:]
        if clean.startswith("```"):
            clean = clean[3:]
        if clean.endswith("```"):
            clean = clean[:-3]
        data = json.loads(clean.strip())
        if isinstance(data, list) and len(data) > 0:
            required_keys = {"type", "severity", "reason", "impact", "recommendation"}
            if all(required_keys.issubset(item.keys()) for item in data):
                return data
    except Exception:
        pass
    return None


def _fallback_explanations(
    flags: List[Dict[str, Any]],
    validation_details: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Generate rule-based explanations when Gemini is unavailable."""
    explanations = []
    vd = validation_details or {}

    for flag in flags:
        check = flag.get("check", "Unknown")
        severity = flag.get("severity", "Medium")
        detail = flag.get("detail", "")

        if "duplicate" in check.lower():
            dup_info = vd.get("duplicate", {})
            explanations.append({
                "type": "Duplicate Invoice",
                "severity": severity,
                "reason": detail or "This invoice number already exists in the system.",
                "impact": "Duplicate payment may occur if approved.",
                "recommendation": "Verify supporting documents before processing payment.",
                "evidence": f"Existing entry found for invoice {dup_info.get('existing_invoice_number', '')}".strip(),
            })
        elif "gst" in check.lower():
            gst_info = vd.get("gst", {})
            explanations.append({
                "type": "GST Invalid",
                "severity": severity,
                "reason": detail or "GSTIN format failed validation.",
                "impact": "Incorrect GST claims may occur.",
                "recommendation": "Verify GST registration with the GST portal.",
                "evidence": f"Received: {gst_info.get('received', '')}. Expected: 15 characters.".strip(),
            })
        elif "amount" in check.lower() and "ledger" in detail.lower():
            ledger_info = vd.get("ledger", {})
            ledger_doc = ledger_info.get("document") or {}
            ledger_total = ledger_doc.get("total_amount") or ledger_doc.get("amount", "N/A")
            explanations.append({
                "type": "Amount Mismatch",
                "severity": severity,
                "reason": detail or "Invoice amount does not match purchase ledger.",
                "impact": "Possible accounting discrepancy or unauthorized billing.",
                "recommendation": "Review PO and payment records.",
                "evidence": f"Ledger amount: ₹{ledger_total}".strip(),
            })
        elif "amount" in check.lower():
            amt_info = vd.get("amount", {})
            explanations.append({
                "type": "Amount Mismatch",
                "severity": severity,
                "reason": detail or "Taxable amount + tax does not equal total amount.",
                "impact": "Possible calculation error in the invoice.",
                "recommendation": "Verify arithmetic and tax calculations.",
                "evidence": detail,
            })
        elif "date" in check.lower() and "ledger" in detail.lower():
            ledger_info = vd.get("ledger", {})
            explanations.append({
                "type": "Date Mismatch",
                "severity": severity,
                "reason": detail or "Invoice date does not match purchase ledger date.",
                "impact": "Posting delay or unauthorized backdating may have occurred.",
                "recommendation": "Verify posting delay and supporting documentation.",
                "evidence": detail,
            })
        elif "date" in check.lower():
            explanations.append({
                "type": "Date Anomaly",
                "severity": severity,
                "reason": detail or "Invoice date appears invalid or anomalous.",
                "impact": "Date-related discrepancies may affect period matching.",
                "recommendation": "Verify the invoice date with the vendor.",
                "evidence": detail,
            })
        elif "vendor" in check.lower():
            explanations.append({
                "type": "Vendor Missing",
                "severity": severity,
                "reason": detail or "Vendor not found in Vendor Master.",
                "impact": "Unauthorized or fictitious vendor risk.",
                "recommendation": "Complete vendor onboarding before payment.",
                "evidence": detail,
            })
        elif "ledger" in check.lower():
            explanations.append({
                "type": "Ledger Missing",
                "severity": severity,
                "reason": detail or "No matching entry found in the purchase ledger.",
                "impact": "Unrecorded liability risk.",
                "recommendation": "Verify the purchase order and ledger entry.",
                "evidence": detail,
            })
        else:
            explanations.append({
                "type": check,
                "severity": severity,
                "reason": detail or f"Flag triggered: {check}.",
                "impact": "Requires manual review.",
                "recommendation": "Investigate the flagged anomaly.",
                "evidence": detail,
            })

    return explanations
