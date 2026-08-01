import os
import json
import logging
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from dotenv import load_dotenv, find_dotenv
from app.database.mongodb import get_database

load_dotenv(find_dotenv(usecwd=True), override=False)

logger = logging.getLogger("app.routes.chat")

router = APIRouter()


class ChatRequest(BaseModel):
    invoice_id: str
    question: str


class ChatResponse(BaseModel):
    answer: str
    invoice_id: str


def _build_invoice_context(invoice_doc: Dict[str, Any], audit_doc: Optional[Dict[str, Any]] = None) -> str:
    """Build a structured text context from invoice and audit documents for the AI."""
    rec = invoice_doc
    ef = rec.get("extracted_fields") or {}

    invoice_number = (
        rec.get("invoiceNumber") or rec.get("invoice_number")
        or rec.get("invoiceNo") or ef.get("invoice_number") or "N/A"
    )
    vendor_name = (
        rec.get("vendorName") or rec.get("vendor")
        or ef.get("vendor_name") or "N/A"
    )
    vendor_gstin = (
        rec.get("gstin") or rec.get("vendor_gstin")
        or ef.get("vendor_gstin") or "N/A"
    )
    invoice_date = (
        rec.get("invoiceDate") or rec.get("invoice_date")
        or ef.get("date") or "N/A"
    )
    total_amount = (
        rec.get("totalAmount") or rec.get("total_amount")
        or rec.get("total") or ef.get("total_amount") or 0.0
    )
    tax_amount = (
        rec.get("taxAmount") or rec.get("tax_amount")
        or ef.get("tax_amount") or 0.0
    )
    taxable_amount = (
        rec.get("taxableValue") or rec.get("taxable_amount")
        or ef.get("taxable_amount") or 0.0
    )
    place_of_supply = rec.get("place_of_supply") or ef.get("place_of_supply") or "N/A"

    risk_score = rec.get("risk_score") or rec.get("riskScore") or (rec.get("risk") or {}).get("risk_score") or 0
    risk_level = rec.get("risk_level") or rec.get("riskLevel") or (rec.get("risk") or {}).get("risk_level") or "Low"
    confidence = rec.get("confidence") or (rec.get("risk") or {}).get("confidence") or 0
    status = rec.get("status") or "N/A"

    exceptions = rec.get("exceptions") or rec.get("flags") or []
    if audit_doc:
        exceptions = exceptions or audit_doc.get("exceptions") or []

    risk_summary = (
        rec.get("risk_summary") or (audit_doc or {}).get("risk_summary")
        or rec.get("summary") or ""
    )
    gemini_analysis = (
        rec.get("gemini_analysis") or (audit_doc or {}).get("gemini_analysis")
        or rec.get("aiExplanation") or rec.get("ai_explanation") or ""
    )
    recommendations = (
        rec.get("recommendations") or (audit_doc or {}).get("recommendations") or ""
    )
    raw_text = rec.get("raw_text") or rec.get("rawText") or ""

    risk_explanations = rec.get("risk_explanations") or (audit_doc or {}).get("risk_explanations") or []

    lines = [
        "=== INVOICE DATA ===",
        f"Invoice Number: {invoice_number}",
        f"Vendor Name: {vendor_name}",
        f"Vendor GSTIN: {vendor_gstin}",
        f"Invoice Date: {invoice_date}",
        f"Place of Supply: {place_of_supply}",
        f"Taxable Amount: ₹{taxable_amount}",
        f"Tax Amount: ₹{tax_amount}",
        f"Total Amount: ₹{total_amount}",
        f"Invoice Status: {status}",
        "",
        "=== RISK ASSESSMENT ===",
        f"Risk Score: {risk_score}/100",
        f"Risk Level: {risk_level}",
        f"Confidence: {confidence}%",
        "",
        "=== DETECTED EXCEPTIONS ===",
    ]

    if exceptions:
        for i, ex in enumerate(exceptions, 1):
            if isinstance(ex, dict):
                check = ex.get("check") or ex.get("name") or "Unknown"
                severity = ex.get("severity") or "Unknown"
                detail = ex.get("detail") or ex.get("message") or ""
                lines.append(f"{i}. [{severity}] {check}: {detail}")
            else:
                lines.append(f"{i}. {ex}")
    else:
        lines.append("No exceptions detected.")

    if risk_explanations:
        lines.append("")
        lines.append("=== DETAILED RISK EXPLANATIONS ===")
        for re_item in risk_explanations:
            if isinstance(re_item, dict):
                lines.append(f"- Type: {re_item.get('type', 'N/A')}")
                lines.append(f"  Severity: {re_item.get('severity', 'N/A')}")
                lines.append(f"  Reason: {re_item.get('reason', 'N/A')}")
                lines.append(f"  Impact: {re_item.get('impact', 'N/A')}")
                lines.append(f"  Recommendation: {re_item.get('recommendation', 'N/A')}")
                if re_item.get("evidence"):
                    lines.append(f"  Evidence: {re_item['evidence']}")
                lines.append("")

    if risk_summary:
        lines.append("")
        lines.append("=== AI RISK SUMMARY ===")
        lines.append(risk_summary)

    if gemini_analysis:
        lines.append("")
        lines.append("=== AI FORENSIC ANALYSIS ===")
        lines.append(gemini_analysis)

    if recommendations:
        lines.append("")
        lines.append("=== RECOMMENDATIONS ===")
        lines.append(recommendations)

    if raw_text:
        lines.append("")
        lines.append("=== RAW OCR TEXT (excerpt) ===")
        lines.append(raw_text[:1500])

    return "\n".join(lines)


def _call_gemini_chat(context: str, question: str) -> str:
    """Call OpenRouter API with invoice context and user question."""
    api_key = os.getenv("OPENROUTER_API_KEY", "")

    system_prompt = """You are an experienced Chartered Accountant and Financial Auditor.

You are analyzing ONE specific invoice. Answer ONLY using the supplied invoice information below.

Rules:
- Never hallucinate or invent data not present in the invoice context.
- If the information does not exist in the context, reply: "This information is not available in the scanned invoice."
- Keep answers professional and concise.
- Explain reasoning clearly.
- Always mention why something is the case.
- Suggest next audit actions when appropriate.
- If the user asks a question completely unrelated to this invoice (e.g., "Who is the Prime Minister?"), reply: "I can only answer questions related to this invoice."
- Do not use markdown code fences in your response."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Invoice Context:\n{context}\n\nUser Question: {question}"}
    ]

    try:
        from openai import OpenAI
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key
        )
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=messages
        )
        if response and response.choices and response.choices[0].message.content:
            return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"OpenRouter API error: {e}")

    return "AI service encountered an error. Please retry."


@router.post("/chat/invoice", response_model=ChatResponse, summary="Ask AI about a specific invoice")
async def chat_about_invoice(req: ChatRequest):
    """
    Chat endpoint for asking questions about a specific invoice.
    Loads invoice + audit data, builds context, sends to Gemini, returns answer.
    """
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    # Load invoice document
    invoice_doc = None
    try:
        obj_id = ObjectId(req.invoice_id)
        invoice_doc = await db["invoices"].find_one({"_id": obj_id})
    except Exception:
        pass

    if not invoice_doc:
        invoice_doc = await db["invoices"].find_one({
            "$or": [
                {"invoiceNumber": req.invoice_id},
                {"invoice_number": req.invoice_id},
                {"invoiceNo": req.invoice_id},
            ]
        })

    if not invoice_doc:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Load matching audit result
    audit_doc = await db["audit_results"].find_one({
        "filename": invoice_doc.get("fileName") or invoice_doc.get("filename")
    })

    # Build context and call Gemini
    context = _build_invoice_context(invoice_doc, audit_doc)
    answer = _call_gemini_chat(context, req.question)

    return ChatResponse(answer=answer, invoice_id=req.invoice_id)
