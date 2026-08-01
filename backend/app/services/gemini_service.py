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
) -> Tuple[str, str, str]:
    """
    Generates an audit-focused AI explanation using Google Gemini API.
    Returns tuple: (risk_summary, gemini_analysis, recommendations)
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
You are a senior forensic auditor writing a detailed compliance analysis for an Invoice Risk Scanner dashboard. Your analysis must be thorough, evidence-based, and actionable.

Invoice Risk Scan Results:
{json.dumps(findings_payload, indent=2)}

<<<<<<< Updated upstream
Based on the above validation payload, write a comprehensive forensic audit analysis. Your response must be a single valid JSON object with exactly three keys:

1. "riskSummary": A one-line headline summary (e.g., "High Risk: Duplicate Submission & Vendor Mismatch Detected"). Be specific about the primary concern.

2. "geminiAnalysis": A detailed forensic audit narrative structured as follows:
   - Open with a **Risk Assessment** paragraph stating the overall risk level and confidence of the finding.
   - Under **Findings Breakdown**, analyze EACH validation flag separately:
     - Explain what the rule engine detected.
     - Explain the financial or compliance implication (e.g., "GSTIN mismatch may indicate invoice is issued by a non-registered entity, risking ITC denial" or "Duplicate invoice poses direct risk of ₹{total_amount} double payment").
     - Assess severity: is this a routine discrepancy or a critical red flag?
   - Under **Vendor & Ledger Reconciliation**, cross-reference:
     - Whether vendor credentials (GSTIN, name) match the approved Vendor Master File.
     - Whether invoice amounts and dates align with purchase ledger entries.
     - Any patterns suggesting unauthorized or fictitious billing.
   - Close with a **Conclusion** paragraph summarizing the overall audit opinion.

3. "recommendations": A prioritized list of next-step actions for the accounts payable team, ordered by urgency:
   - Immediate actions (e.g., "Suspend payment until duplicate is verified").
   - Secondary verification steps (e.g., "Cross-check vendor GSTIN against GST portal records").
   - Preventive measures (e.g., "Enable duplicate invoice detection flag in ERP for this vendor").

Do NOT include markdown code fences (```json) around the JSON. Return ONLY the raw JSON object.
=======
Please generate a JSON response with exactly three keys:
1. "riskSummary": A concise risk summary headline.
2. "geminiAnalysis": A detailed forensic AI explanation that may include paragraphs, bullet points, or numbered lists.
3. "recommendations": Clear next-step recommendations for review or approval.

Do NOT include markdown formatting outside the raw JSON object. Return strictly valid JSON with "riskSummary", "geminiAnalysis", and "recommendations".
>>>>>>> Stashed changes
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
                            return parsed["riskSummary"], parsed["geminiAnalysis"], parsed["recommendations"]
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
                            return parsed["riskSummary"], parsed["geminiAnalysis"], parsed["recommendations"]
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
        if "riskSummary" in data and "geminiAnalysis" in data and "recommendations" in data:
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
) -> Tuple[str, str, str]:
<<<<<<< Updated upstream
    inv_num = invoice_number or "Invoice"
    issue_msgs = ", ".join(formatted_issues) if formatted_issues else ""
    amt_str = f"₹{total_amount:,.2f}" if isinstance(total_amount, (int, float)) and total_amount > 0 else "₹0.00"

    if not formatted_issues:
        summary = "Invoice verified cleanly against master records."
        narrative = (
            f"{inv_num} has passed all cross-validation checks with Vendor Master and Purchase Ledger. "
            f"No discrepancies were detected in pricing, dates, or vendor credentials. The invoice is verified and safe for payment approval."
        )
=======
    inv_num = invoice.get("invoiceNumber", "Invoice")
    if not issues:
        summary = "Invoice verified cleanly against master records."
        narrative = f"{inv_num} has passed all cross-validation checks with Vendor Master and Purchase Ledger. No discrepancies were detected in pricing, dates, or vendor credentials. The invoice is verified and safe for payment approval."
>>>>>>> Stashed changes
        recommendations = "No further action is required beyond standard processing."
        return summary, narrative, recommendations

    if any("duplicate" in issue.lower() for issue in formatted_issues):
        summary = "Potential duplicate invoice submission detected."
<<<<<<< Updated upstream
        narrative = (
            f"{inv_num} appears more than once in the invoice repository, indicating a potential duplicate submission. "
            f"Processing duplicate invoices poses a direct risk of double payment and erroneous cash outflow. Manual verification is strongly recommended before payment approval."
        )
        recommendations = "Suspend payment and validate the invoice against purchase orders and prior vendor invoices."
    elif risk_score > 50 or risk_level == "High":
        summary = f"Critical audit anomalies flagged ({risk_level} Risk)."
        narrative = (
            f"{inv_num} exhibits multiple high-severity audit discrepancies: {issue_msgs}. "
            f"These unverified items present financial and compliance exposure for the organization. "
            f"Payment should be placed on hold pending complete vendor verification."
        )
        recommendations = "Place the invoice on hold and complete a full compliance review with the vendor and purchase ledger."
    elif risk_score >= 21 or risk_level == "Medium":
        summary = f"Purchase ledger or vendor discrepancy noted ({risk_level} Risk)."
        narrative = (
            f"{inv_num} has been flagged for exceptions including {issue_msgs}. "
            f"While the invoice may be valid, these discrepancies require cross-checking with purchase orders and vendor records prior to final disbursement."
        )
        recommendations = "Review the flagged discrepancies and verify supporting documents before approving payment."
    else:
        summary = "Minor invoice discrepancies noted."
        narrative = (
            f"{inv_num} contains minor record variations ({issue_msgs}). "
            f"Standard routine review is advised before finalizing payment."
        )
=======
        narrative = f"{inv_num} appears more than once in the invoice repository, indicating a potential duplicate submission. Processing duplicate invoices poses a direct risk of double payment and erroneous cash outflow. Manual verification is strongly recommended before payment approval."
        recommendations = "Suspend payment and validate the invoice against purchase orders and prior vendor invoices."
    elif risk_score > 50:
        summary = f"Critical audit anomalies flagged ({risk_level} Risk)."
        narrative = f"{inv_num} exhibits multiple high-severity audit discrepancies: {issue_msgs}. These unverified items present financial and compliance exposure for the organization. Payment should be placed on hold pending complete vendor verification."
        recommendations = "Place the invoice on hold and complete a full compliance review with the vendor and purchase ledger."
    elif risk_score >= 21:
        summary = f"Purchase ledger or vendor discrepancy noted ({risk_level} Risk)."
        narrative = f"{inv_num} has been flagged for exceptions including {issue_msgs}. While the invoice may be valid, these discrepancies require cross-checking with purchase orders and vendor records prior to final disbursement."
        recommendations = "Review the flagged discrepancies and verify supporting documents before approving payment."
    else:
        summary = "Minor invoice discrepancies noted."
        narrative = f"{inv_num} contains minor record variations ({issue_msgs}). Standard routine review is advised before finalizing payment."
>>>>>>> Stashed changes
        recommendations = "Confirm the minor discrepancies and proceed with normal approval once verified."

    return summary, narrative, recommendations
