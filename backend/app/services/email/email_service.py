import logging
import os
import re
from datetime import datetime
from io import BytesIO
<<<<<<< Updated upstream
from typing import Any, Dict, Optional, Tuple

from fastapi import HTTPException
=======
from typing import Any, Dict, Optional

from fastapi import HTTPException, UploadFile
>>>>>>> Stashed changes
from fastapi_mail import MessageSchema, MessageType
from starlette.datastructures import UploadFile as StarletteUploadFile
from jinja2 import Environment, FileSystemLoader, select_autoescape
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from bson import ObjectId

from app.core.config import settings
from app.core.mail import fastmail
from app.database.mongodb import get_database

logger = logging.getLogger("app.services.email")


<<<<<<< Updated upstream
def enrich_invoice_data(invoice_doc: Dict[str, Any], audit_doc: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Enriches a raw invoice MongoDB document with audit results,
    matching the same logic used by GET /api/invoices/{id}.
    """
    record = invoice_doc

    # Resolve risk fields from multiple possible storage locations
    risk_data = {
        "risk_score": (
            record.get("risk_score")
            or record.get("riskScore")
            or (record.get("risk") or {}).get("risk_score")
            or 0
        ),
        "risk_level": (
            record.get("risk_level")
            or record.get("riskLevel")
            or (record.get("risk") or {}).get("risk_level")
            or "Low"
        ),
        "confidence": (
            record.get("confidence")
            or (record.get("risk") or {}).get("confidence")
            or 0
        ),
    }

    # Resolve OCR extracted fields (may be nested under extracted_fields or top-level)
    ef = record.get("extracted_fields") or {}

    invoice_number = (
        record.get("invoiceNumber")
        or record.get("invoice_number")
        or record.get("invoiceNo")
        or ef.get("invoice_number")
        or ef.get("invoiceNumber")
        or "N/A"
    )
    vendor_name = (
        record.get("vendorName")
        or record.get("vendor")
        or ef.get("vendor_name")
        or ef.get("vendorName")
        or "N/A"
    )
    vendor_gstin = (
        record.get("gstin")
        or record.get("vendor_gstin")
        or ef.get("vendor_gstin")
        or ef.get("gstin")
        or "N/A"
    )
    invoice_date = (
        record.get("invoiceDate")
        or record.get("invoice_date")
        or ef.get("date")
        or ef.get("invoiceDate")
        or "N/A"
    )
    taxable_amount = (
        record.get("taxable_amount")
        or record.get("taxableValue")
        or ef.get("taxable_amount")
        or 0.0
    )
    tax_amount = (
        record.get("tax_amount")
        or record.get("taxAmount")
        or ef.get("tax_amount")
        or 0.0
    )
    total_amount = (
        record.get("total_amount")
        or record.get("totalAmount")
        or record.get("total")
        or ef.get("total_amount")
        or 0.0
    )
    place_of_supply = record.get("place_of_supply") or ef.get("place_of_supply") or ""
    status = record.get("status") or "Pending Review"

    # Resolve exceptions/flags
    exceptions = record.get("exceptions") or record.get("flags") or []

    # Resolve Gemini analysis — prefer invoice doc, fallback to audit doc, then legacy fields
    risk_summary = (
        record.get("risk_summary")
        or (audit_doc or {}).get("risk_summary")
        or record.get("summary")
        or (audit_doc or {}).get("summary")
        or ""
    )
    gemini_analysis = (
        record.get("gemini_analysis")
        or (audit_doc or {}).get("gemini_analysis")
        or record.get("ai_explanation")
        or record.get("aiExplanation")
        or (audit_doc or {}).get("ai_explanation")
        or ""
    )
    recommendations = (
        record.get("recommendations")
        or (audit_doc or {}).get("recommendations")
        or ""
    )

    return {
        "invoice_number": invoice_number,
        "vendor_name": vendor_name,
        "vendor_gstin": vendor_gstin,
        "invoice_date": invoice_date,
        "taxable_amount": taxable_amount,
        "tax_amount": tax_amount,
        "total_amount": total_amount,
        "place_of_supply": place_of_supply,
        "status": status,
        "risk_score": risk_data["risk_score"],
        "risk_level": risk_data["risk_level"],
        "confidence": risk_data["confidence"],
        "exceptions": exceptions,
        "risk_summary": risk_summary,
        "gemini_analysis": gemini_analysis,
        "recommendations": recommendations,
    }


=======
>>>>>>> Stashed changes
class EmailService:
    def __init__(self) -> None:
        self.template_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "templates", "email")
        self.jinja_env = Environment(
            loader=FileSystemLoader(self.template_dir),
            autoescape=select_autoescape(["html", "xml"]),
        )

    def validate_recipient_email(self, email: str) -> str:
        if not email or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
            raise ValueError("Invalid email")
        return email.strip().lower()

<<<<<<< Updated upstream
    def _build_pdf_bytes(self, data: Dict[str, Any]) -> bytes:
=======
    def _build_pdf_bytes(self, invoice_doc: Dict[str, Any]) -> bytes:
>>>>>>> Stashed changes
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

<<<<<<< Updated upstream
        # Header
=======
>>>>>>> Stashed changes
        p.setFillColorRGB(0.24, 0.03, 0.33)
        p.rect(0, height - 60, width, 60, fill=True, stroke=False)
        p.setFillColorRGB(1, 1, 1)
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, height - 38, "TETRA — Invoice Risk Analysis Report")

        y = height - 90
<<<<<<< Updated upstream

        # Invoice details section
        p.setFillColorRGB(0, 0, 0)
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, y, f"Invoice #{data['invoice_number']}")
        y -= 25

        detail_fields = [
            ("Invoice Number", data["invoice_number"]),
            ("Vendor", data["vendor_name"]),
            ("Vendor GSTIN", data["vendor_gstin"]),
            ("Invoice Date", data["invoice_date"]),
            ("Place of Supply", data["place_of_supply"] or "N/A"),
        ]

        p.setFont("Helvetica", 10)
        for label, value in detail_fields:
            if value and value != "N/A":
                p.setFont("Helvetica-Bold", 10)
                p.drawString(50, y, f"{label}:")
                p.setFont("Helvetica", 10)
                p.drawString(180, y, str(value))
                y -= 18
                if y < 60:
                    p.showPage()
                    y = height - 60

        # Amounts section
        y -= 10
        p.setFont("Helvetica-Bold", 11)
        p.drawString(50, y, "Amount Breakdown")
        y -= 18

        amounts = [
            ("Taxable Amount", f"INR {data['taxable_amount']:,.2f}"),
            ("Tax Amount (GST)", f"INR {data['tax_amount']:,.2f}"),
            ("Total Amount", f"INR {data['total_amount']:,.2f}"),
        ]
        for label, value in amounts:
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, y, f"{label}:")
            p.setFont("Helvetica", 10)
            p.drawString(180, y, value)
            y -= 18
            if y < 60:
                p.showPage()
                y = height - 60

        # Risk assessment section
        y -= 10
        p.setFont("Helvetica-Bold", 11)
        p.drawString(50, y, "Risk Assessment")
        y -= 18

        risk_fields = [
            ("Risk Score", f"{data['risk_score']}/100"),
            ("Risk Level", data["risk_level"]),
            ("Confidence", f"{data['confidence']:.1f}%"),
            ("Status", data["status"]),
        ]
        for label, value in risk_fields:
=======
        p.setFillColorRGB(0, 0, 0)
        p.setFont("Helvetica-Bold", 13)
        invoice_number = invoice_doc.get("invoiceNumber") or invoice_doc.get("invoice_number") or invoice_doc.get("invoiceNo") or "N/A"
        p.drawString(50, y, f"Invoice Number: {invoice_number}")
        y -= 25

        field_map = [
            ("invoiceNumber", "Invoice Number"),
            ("invoice_number", "Invoice Number"),
            ("invoiceNo", "Invoice Number"),
            ("vendor", "Vendor"),
            ("vendorName", "Vendor"),
            ("invoiceDate", "Invoice Date"),
            ("invoice_date", "Invoice Date"),
            ("riskLevel", "Risk Level"),
            ("risk_level", "Risk Level"),
            ("riskScore", "Risk Score"),
            ("risk_score", "Risk Score"),
            ("confidence", "Confidence"),
            ("status", "Status"),
        ]

        p.setFont("Helvetica", 11)
        for field, label in field_map:
            value = invoice_doc.get(field)
            if value is None:
                continue
>>>>>>> Stashed changes
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, y, f"{label}:")
            p.setFont("Helvetica", 10)
            p.drawString(180, y, str(value))
            y -= 18
            if y < 60:
                p.showPage()
                y = height - 60

<<<<<<< Updated upstream
        # Exceptions section
        if data["exceptions"]:
=======
        if invoice_doc.get("exceptions"):
>>>>>>> Stashed changes
            y -= 12
            p.setFont("Helvetica-Bold", 11)
            p.drawString(50, y, "Detected Anomalies:")
            y -= 16
            p.setFont("Helvetica", 10)
<<<<<<< Updated upstream
            for flag in data["exceptions"]:
                check = flag.get("check") or ""
                severity = flag.get("severity") or ""
                detail = flag.get("detail") or ""
                line = f"[{severity}] {check}: {detail}" if check else detail
                p.drawString(50, y, f"- {line}")
=======
            for flag in invoice_doc.get("exceptions", []):
                detail = flag.get("detail") or flag.get("check") or ""
                p.drawString(50, y, f"- {detail}")
>>>>>>> Stashed changes
                y -= 14
                if y < 60:
                    p.showPage()
                    y = height - 60

<<<<<<< Updated upstream
        # Gemini Risk Summary
        if data["risk_summary"]:
=======
        if invoice_doc.get("risk_summary"):
>>>>>>> Stashed changes
            y -= 20
            p.setFont("Helvetica-Bold", 11)
            p.drawString(50, y, "Risk Summary:")
            y -= 14
            p.setFont("Helvetica", 10)
<<<<<<< Updated upstream
            for line in str(data["risk_summary"]).splitlines():
=======
            for line in str(invoice_doc.get("risk_summary")).splitlines():
>>>>>>> Stashed changes
                p.drawString(50, y, line)
                y -= 14
                if y < 60:
                    p.showPage()
                    y = height - 60

<<<<<<< Updated upstream
        # Gemini Analysis
        if data["gemini_analysis"]:
            y -= 20
            p.setFont("Helvetica-Bold", 11)
            p.drawString(50, y, "AI Forensic Analysis:")
            y -= 14
            p.setFont("Helvetica", 10)
            for line in str(data["gemini_analysis"]).splitlines():
                if line.strip():
                    p.drawString(50, y, line.strip())
                    y -= 14
                    if y < 60:
                        p.showPage()
                        y = height - 60

        # Recommendations
        if data["recommendations"]:
=======
        if invoice_doc.get("gemini_analysis"):
            y -= 20
            p.setFont("Helvetica-Bold", 11)
            p.drawString(50, y, "AI Analysis:")
            y -= 14
            p.setFont("Helvetica", 10)
            for line in str(invoice_doc.get("gemini_analysis")).splitlines():
                p.drawString(50, y, line)
                y -= 14
                if y < 60:
                    p.showPage()
                    y = height - 60

        if invoice_doc.get("recommendations"):
>>>>>>> Stashed changes
            y -= 20
            p.setFont("Helvetica-Bold", 11)
            p.drawString(50, y, "Recommendations:")
            y -= 14
            p.setFont("Helvetica", 10)
<<<<<<< Updated upstream
            for line in str(data["recommendations"]).splitlines():
                if line.strip():
                    p.drawString(50, y, line.strip())
                    y -= 14
                    if y < 60:
                        p.showPage()
                        y = height - 60

        # Footer
=======
            for line in str(invoice_doc.get("recommendations")).splitlines():
                p.drawString(50, y, line)
                y -= 14
                if y < 60:
                    p.showPage()
                    y = height - 60

>>>>>>> Stashed changes
        p.setFont("Helvetica-Oblique", 10)
        p.drawString(50, max(70, y - 20), "Prepared by TETRA AI Risk Scanner")

        p.save()
        buffer.seek(0)
        return buffer.getvalue()

<<<<<<< Updated upstream
    def _render_html_template(self, data: Dict[str, Any], recipient: str) -> str:
        anomaly_summary = (
            "No anomalies detected."
            if not data["exceptions"]
            else ", ".join(
                [item.get("detail") or item.get("check") or "anomaly" for item in data["exceptions"][:6]]
            )
        )

        context = {
            "invoice_number": data["invoice_number"],
            "vendor": data["vendor_name"],
            "vendor_gstin": data["vendor_gstin"],
            "invoice_date": data["invoice_date"],
            "taxable_amount": data["taxable_amount"],
            "tax_amount": data["tax_amount"],
            "total_amount": data["total_amount"],
            "place_of_supply": data["place_of_supply"],
            "risk_score": data["risk_score"],
            "risk_level": data["risk_level"],
            "confidence": data["confidence"],
            "status": data["status"],
            "summary": anomaly_summary,
            "risk_summary": data["risk_summary"],
            "gemini_analysis": data["gemini_analysis"],
            "recommendations": data["recommendations"],
=======
    def _render_html_template(self, invoice_doc: Dict[str, Any], audit_doc: Optional[Dict[str, Any]], recipient: str) -> str:
        invoice_number = invoice_doc.get("invoiceNumber") or invoice_doc.get("invoice_number") or invoice_doc.get("invoiceNo") or "N/A"
        vendor = invoice_doc.get("vendorName") or invoice_doc.get("vendor") or "N/A"
        invoice_date = invoice_doc.get("invoiceDate") or invoice_doc.get("invoice_date") or "N/A"
        risk_score = invoice_doc.get("riskScore") or invoice_doc.get("risk_score") or 0
        risk_level = invoice_doc.get("riskLevel") or invoice_doc.get("risk_level") or "Low"
        confidence = invoice_doc.get("confidence") or (audit_doc or {}).get("risk", {}).get("confidence") or 0
        anomalies = invoice_doc.get("exceptions") or (audit_doc or {}).get("exceptions") or []
        anomaly_summary = "No anomalies detected." if not anomalies else ", ".join([item.get("detail") or item.get("check") or "anomaly" for item in anomalies[:4]])
        risk_summary = invoice_doc.get("risk_summary") or (audit_doc or {}).get("risk_summary") or invoice_doc.get("summary") or ""
        gemini_analysis = invoice_doc.get("gemini_analysis") or (audit_doc or {}).get("gemini_analysis") or invoice_doc.get("aiExplanation") or ""
        recommendations = invoice_doc.get("recommendations") or (audit_doc or {}).get("recommendations") or ""
        context = {
            "invoice_number": invoice_number,
            "vendor": vendor,
            "invoice_date": invoice_date,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "confidence": confidence,
            "summary": anomaly_summary,
            "risk_summary": risk_summary,
            "gemini_analysis": gemini_analysis,
            "recommendations": recommendations,
>>>>>>> Stashed changes
            "recipient": recipient,
            "message": "Please find the attached Invoice Risk Analysis Report.",
        }
        template = self.jinja_env.get_template("report.html")
        return template.render(**context)

    async def send_report(self, invoice_id: str, email: str) -> Dict[str, Any]:
        recipient = self.validate_recipient_email(email)
        db = get_database()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not initialized")

<<<<<<< Updated upstream
        # ── Fetch invoice document ─────────────────────────────────────────────
=======
>>>>>>> Stashed changes
        invoice_doc = None
        try:
            invoice_obj_id = ObjectId(invoice_id)
            invoice_doc = await db["invoices"].find_one({"_id": invoice_obj_id})
        except Exception:
            invoice_doc = None

        if not invoice_doc:
            invoice_doc = await db["invoices"].find_one({
                "$or": [
                    {"invoiceNumber": invoice_id},
                    {"invoice_number": invoice_id},
                    {"invoiceNo": invoice_id},
                ]
            })

        if not invoice_doc:
            raise HTTPException(status_code=404, detail="Invoice not found")

<<<<<<< Updated upstream
        # ── Fetch matching audit result ────────────────────────────────────────
        audit_doc = await db["audit_results"].find_one({
            "filename": invoice_doc.get("fileName") or invoice_doc.get("filename")
        })

        # ── Enrich using same logic as GET /api/invoices/{id} ──────────────────
        data = enrich_invoice_data(invoice_doc, audit_doc)

        # ── Build PDF and HTML ─────────────────────────────────────────────────
        pdf_bytes = self._build_pdf_bytes(data)
        html_body = self._render_html_template(data, recipient)

        attachment = StarletteUploadFile(
            filename=f"invoice_{data['invoice_number']}_report.pdf",
            file=BytesIO(pdf_bytes),
        )
        message = MessageSchema(
            subject=f"Invoice Risk Analysis Report — {data['invoice_number']}",
=======
        audit_doc = await db["audit_results"].find_one({"filename": invoice_doc.get("fileName") or invoice_doc.get("filename")})
        if not audit_doc:
            logger.warning("Audit result not found for invoice %s; continuing with invoice metadata.", invoice_id)

        pdf_bytes = self._build_pdf_bytes(invoice_doc)
        html_body = self._render_html_template(invoice_doc, audit_doc, recipient)

        attachment = StarletteUploadFile(
            filename="invoice_report.pdf",
            file=BytesIO(pdf_bytes),
        )
        message = MessageSchema(
            subject="Invoice Risk Analysis Report",
>>>>>>> Stashed changes
            recipients=[recipient],
            body=html_body,
            subtype=MessageType.html,
            attachments=[attachment],
        )

        if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD or not settings.MAIL_FROM:
            raise HTTPException(status_code=500, detail="SMTP credentials are not configured")

        try:
            await fastmail.send_message(message)
            status = "sent"
        except Exception as exc:
            logger.exception("Failed to send email report for invoice %s", invoice_id)
            await db["email_history"].insert_one({
                "invoice_id": invoice_id,
<<<<<<< Updated upstream
                "invoice_number": data["invoice_number"],
=======
                "invoice_number": invoice_doc.get("invoiceNumber") or invoice_doc.get("invoice_number") or invoice_doc.get("invoiceNo"),
>>>>>>> Stashed changes
                "recipient": recipient,
                "sent_at": datetime.utcnow().isoformat(),
                "status": "failed",
            })
            raise HTTPException(status_code=502, detail=f"SMTP failure: {exc}") from exc

        await db["email_history"].insert_one({
            "invoice_id": invoice_id,
<<<<<<< Updated upstream
            "invoice_number": data["invoice_number"],
=======
            "invoice_number": invoice_doc.get("invoiceNumber") or invoice_doc.get("invoice_number") or invoice_doc.get("invoiceNo"),
>>>>>>> Stashed changes
            "recipient": recipient,
            "sent_at": datetime.utcnow().isoformat(),
            "status": status,
        })
        logger.info("Email report sent successfully for invoice %s to %s", invoice_id, recipient)
        return {"success": True, "message": "Report sent successfully."}
