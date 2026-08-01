import os
import json
from typing import Dict, Any, List, Tuple, Optional
from app.config import settings

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
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return _generate_fallback_explanation(invoice, issues, risk_score, risk_level)

    issue_descriptions = [i.get("message", "") for i in issues]
    
    findings_payload = {
        "invoiceNumber": invoice.get("invoiceNumber", "N/A"),
        "vendorName": invoice.get("vendorName", "N/A"),
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "issues": issue_descriptions
    }

    prompt = f"""
You are a Senior Forensic Auditor writing an executive audit summary for an invoice risk scanner dashboard.

Audit Findings Payload:
{json.dumps(findings_payload, indent=2)}

Please generate a JSON response with exactly two keys:
1. "summary": A short 1-sentence headline (e.g. "Potential duplicate invoice submission detected.").
2. "aiExplanation": A professional 2-3 sentence forensic audit narrative. Explain what anomaly was detected, why it poses a financial risk (e.g., risk of double payment, unverified vendor liability), and conclude with an auditor recommendation (e.g., manual verification required before approval).

Do NOT include markdown formatting outside the raw JSON object. Return strictly valid JSON with "summary" and "aiExplanation".
"""

    try:
        # Try new google-genai SDK first
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            for model_name in ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"]:
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

        # Fallback to google-generativeai SDK
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            for model_name in ["gemini-1.5-flash-latest", "gemini-2.0-flash", "gemini-pro"]:
                try:
                    model = genai.GenerativeModel(model_name)
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
        print(f"[Gemini Service Warning] Gemini API call failed: {e}")

    return _generate_fallback_explanation(invoice, issues, risk_score, risk_level)

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
    invoice: Dict[str, Any],
    issues: List[Dict[str, Any]],
    risk_score: int,
    risk_level: str
) -> Tuple[str, str]:
    inv_num = invoice.get("invoiceNumber", "Invoice")
    if not issues:
        summary = "Invoice verified cleanly against master records."
        narrative = f"{inv_num} has passed all cross-validation checks with Vendor Master and Purchase Ledger. No discrepancies were detected in pricing, dates, or vendor credentials. The invoice is verified and safe for payment approval."
        return summary, narrative

    issue_msgs = "; ".join([i.get("message", "") for i in issues])

    if any("duplicate" in i.get("message", "").lower() for i in issues):
        summary = "Potential duplicate invoice submission detected."
        narrative = f"{inv_num} appears more than once in the invoice repository, indicating a potential duplicate submission. Processing duplicate invoices poses a direct risk of double payment and erroneous cash outflow. Manual verification is strongly recommended before payment approval."
    elif risk_score > 50:
        summary = f"Critical audit anomalies flagged ({risk_level} Risk)."
        narrative = f"{inv_num} exhibits multiple high-severity audit discrepancies: {issue_msgs}. These unverified items present financial and compliance exposure for the organization. Payment should be placed on hold pending complete vendor verification."
    elif risk_score >= 21:
        summary = f"Purchase ledger or vendor discrepancy noted ({risk_level} Risk)."
        narrative = f"{inv_num} has been flagged for exceptions including {issue_msgs}. While the invoice may be valid, these discrepancies require cross-checking with purchase orders and vendor records prior to final disbursement."
    else:
        summary = "Minor invoice discrepancies noted."
        narrative = f"{inv_num} contains minor record variations ({issue_msgs}). Standard routine review is advised before finalizing payment."

    return summary, narrative
