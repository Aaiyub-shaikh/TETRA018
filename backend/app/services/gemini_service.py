import os
import json
import logging
from typing import Dict, Any, List, Tuple, Optional
from app.core.config import settings

logger = logging.getLogger("app.gemini")

def extract_issue_text(i: Any) -> str:
    """Helper to convert string or dict issue objects into clean readable text without duplication."""
    if isinstance(i, str):
        text = i
    elif isinstance(i, dict):
        check = (i.get("check") or i.get("name") or "").strip()
        detail = (i.get("detail") or i.get("message") or i.get("reason") or "").strip()
        if check and detail:
            if detail.lower().startswith(check.lower()):
                text = detail
            else:
                text = f"{check}: {detail}"
        else:
            text = check or detail or str(i)
    else:
        text = str(i)

    # Clean up raw backend internal terms
    text = text.replace("vendor_not_found", "Vendor not found in Master File")
    text = text.replace("ledger_missing", "Purchase ledger entry missing")
    return text.strip()

def generate_ai_explanation(
    invoice: Dict[str, Any],
    issues: List[Dict[str, Any]],
    risk_score: int,
    risk_level: str
) -> Tuple[str, str]:
    """
    Generates an audit-focused AI explanation and headline summary using Google Gemini API.
    Returns tuple: (headline_summary, full_audit_narrative)
    """
    api_key = getattr(settings, "GEMINI_API_KEY", os.getenv("GEMINI_API_KEY", ""))
    
    invoice_number = (
        invoice.get("invoice_number")
        or invoice.get("invoiceNumber")
        or "INV-100"
    )
    vendor_name = (
        invoice.get("vendor_name")
        or invoice.get("vendor")
        or invoice.get("vendorName")
        or "Unknown Vendor"
    )
    vendor_gstin = (
        invoice.get("vendor_gstin")
        or invoice.get("gstin")
        or "Not Provided"
    )
    total_amount = (
        invoice.get("total_amount")
        or invoice.get("total")
        or invoice.get("amount")
        or 0.0
    )

    formatted_issues = [extract_issue_text(i) for i in issues if extract_issue_text(i)]

    # If no API key, return structured fallback immediately
    if not api_key:
        return _generate_fallback_explanation(
            invoice_number, vendor_name, vendor_gstin, total_amount, issues, formatted_issues, risk_score, risk_level
        )

    findings_payload = {
        "invoiceNumber": invoice_number,
        "vendorName": vendor_name,
        "gstin": vendor_gstin,
        "totalAmount": total_amount,
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "validationFlags": formatted_issues
    }

    prompt = f"""
You are an experienced financial auditor writing a formal compliance audit explanation for an Invoice Risk Scanner dashboard.

Rule Engine Validation Payload:
{json.dumps(findings_payload, indent=2)}

Instructions:
1. Explain each issue separately under clear headings.
2. Explain why it is important (e.g. risk of double payment, input tax credit denial, payment redirect).
3. Avoid making unsupported accusations such as fraud.
4. Recommend practical next steps for the accounts payable team.
5. Use professional, clear audit language.
6. Return strictly a JSON object with two keys:
   - "summary": A concise 1-sentence headline summary (e.g., "High Risk: Duplicate Invoice & GSTIN Discrepancy Flagged").
   - "aiExplanation": A structured auditor explanation with Risk Assessment, Findings Breakdown, and Recommendation.

Do NOT include markdown wrapping outside the raw JSON object.
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
                        parsed = _parse_json_response(response.text)
                        if parsed:
                            return parsed["summary"], parsed["aiExplanation"]
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
                        parsed = _parse_json_response(response.text)
                        if parsed:
                            return parsed["summary"], parsed["aiExplanation"]
                except Exception:
                    continue
        except Exception:
            pass

    except Exception as e:
        logger.warning(f"Gemini API call failed: {e}")

    return _generate_fallback_explanation(
        invoice_number, vendor_name, vendor_gstin, total_amount, issues, formatted_issues, risk_score, risk_level
    )

def _parse_json_response(text: str) -> Optional[Dict[str, str]]:
    try:
        clean_text = text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        data = json.loads(clean_text.strip())
        if "summary" in data and "aiExplanation" in data:
            return data
    except Exception:
        pass
    return None

def _generate_fallback_explanation(
    invoice_number: str,
    vendor_name: str,
    vendor_gstin: str,
    total_amount: float,
    raw_issues: List[Any],
    formatted_issues: List[str],
    risk_score: int,
    risk_level: str
) -> Tuple[str, str]:
    """Generates structured, professional auditor explanations when LLM API is offline."""
    amt_str = f"₹{total_amount:,.2f}" if isinstance(total_amount, (int, float)) and total_amount > 0 else "₹0.00"

    if not formatted_issues or len(formatted_issues) == 0:
        summary = "Clean Audit: Verified against master records."
        narrative = (
            f"**Risk Assessment: Low (0/100)**\n\n"
            f"Invoice **{invoice_number}** ({vendor_name}) passed all rule engine validation checks cleanly against master vendor databases and purchase ledger records.\n\n"
            f"**Reasoning:**\n"
            f"* **GSTIN Format**: Valid format ({vendor_gstin}).\n"
            f"* **Vendor Verification**: Matched approved Vendor Master File.\n"
            f"* **Ledger Match**: Invoice total ({amt_str}) matches purchase ledger entry.\n"
            f"* **Duplicate Check**: No matching invoice records detected in billing repository.\n\n"
            f"**Recommendation:**\n"
            f"Approved for standard payment processing."
        )
        return summary, narrative

    # Categorize findings cleanly without duplicate headers
    findings = []
    for idx, issue_text in enumerate(formatted_issues, 1):
        findings.append(f"{idx}. {issue_text}")

    findings_block = "\n".join(findings)

    if risk_score >= 75 or risk_level == "High":
        summary = f"High Risk ({risk_score}/100): Critical audit discrepancies detected"
        narrative = (
            f"**Risk Assessment: High ({risk_score}/100)**\n\n"
            f"Invoice **{invoice_number}** for **{vendor_name}** ({amt_str}) exhibits {len(formatted_issues)} validation exception(s) requiring auditor attention before payment authorization.\n\n"
            f"**Rule Engine Findings:**\n"
            f"{findings_block}\n\n"
            f"**Audit Impact & Reasoning:**\n"
            f"Anomalies between invoice parameters and ledger records present financial exposure, such as potential duplicate payments, unverified vendor liabilities, or tax compliance issues.\n\n"
            f"**Recommended Actions:**\n"
            f"* Place payment on hold in Accounts Payable.\n"
            f"* Verify vendor GSTIN ({vendor_gstin}) and registration details.\n"
            f"* Confirm purchase order matching before disbursement."
        )
    elif risk_score >= 25 or risk_level == "Medium":
        summary = f"Medium Risk ({risk_score}/100): Parameter or ledger mismatch"
        narrative = (
            f"**Risk Assessment: Medium ({risk_score}/100)**\n\n"
            f"Invoice **{invoice_number}** for **{vendor_name}** ({amt_str}) was flagged with {len(formatted_issues)} exception(s) during automated verification.\n\n"
            f"**Rule Engine Findings:**\n"
            f"{findings_block}\n\n"
            f"**Audit Impact & Reasoning:**\n"
            f"Discrepancies between invoice fields and ledger records may result from administrative posting delays, missing PO entries, or rate variations.\n\n"
            f"**Recommended Actions:**\n"
            f"* Review supporting goods received notes (GRN) and purchase orders.\n"
            f"* Perform manual verification before disbursement."
        )
    else:
        summary = f"Low Risk ({risk_score}/100): Minor record variations"
        narrative = (
            f"**Risk Assessment: Low ({risk_score}/100)**\n\n"
            f"Invoice **{invoice_number}** ({vendor_name}) contains minor record variations:\n\n"
            f"{findings_block}\n\n"
            f"**Recommended Actions:**\n"
            f"Proceed with standard routine review."
        )

    return summary, narrative
