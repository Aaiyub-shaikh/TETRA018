from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.database.mongodb import get_database
from app.services.risk.risk_engine import run_risk_engine
from bson import ObjectId
from fastapi.responses import StreamingResponse
from io import BytesIO, StringIO
import csv
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

router = APIRouter()


@router.get("/invoices", summary="List all processed invoices")
async def list_invoices():
    db = get_database()
    if db is None:
        return {"invoices": [], "total": 0}
    try:
        cursor = db["invoices"].find({}).sort("invoiceDate", -1)
        invoices = await cursor.to_list(length=100)
        # Convert ObjectId to string for JSON serialization
        for inv in invoices:
            if "_id" in inv:
                inv["_id"] = str(inv["_id"])
        return {"invoices": invoices, "total": len(invoices)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")


# ── Specific sub-routes MUST come before the generic /{invoice_id} route ────────

@router.get("/invoices/{invoice_id}/report", summary="Generate PDF report for invoice")
async def get_invoice_report(invoice_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    try:
        try:
            obj_id = ObjectId(invoice_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid invoice ID format")

        doc = await db["invoices"].find_one({"_id": obj_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Invoice not found")

        # Convert ObjectId to string so it renders in PDF
        doc["_id"] = str(doc["_id"])

        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Header
        p.setFillColorRGB(0.24, 0.03, 0.33)  # #3E0856
        p.rect(0, height - 60, width, 60, fill=True, stroke=False)
        p.setFillColorRGB(1, 1, 1)
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, height - 38, "TETRA — Invoice Report")

        y = height - 90
        p.setFillColorRGB(0, 0, 0)
        p.setFont("Helvetica-Bold", 13)
        inv_no = doc.get("invoiceNumber") or doc.get("invoice_number") or doc.get("invoiceNo") or "N/A"
        p.drawString(50, y, f"Invoice: {inv_no}")
        y -= 25

        # Key fields in a readable order
        FIELD_MAP = [
            ("invoiceNo",      "Invoice No"),
            ("invoiceNumber",  "Invoice No"),
            ("invoice_number", "Invoice No"),
            ("vendor",         "Vendor"),
            ("vendorName",     "Vendor"),
            ("gstin",          "GSTIN"),
            ("vendor_gstin",   "GSTIN"),
            ("invoiceDate",    "Invoice Date"),
            ("invoice_date",   "Invoice Date"),
            ("invoiceSum",     "Total Amount"),
            ("totalAmount",    "Total Amount"),
            ("total_amount",   "Total Amount"),
            ("taxAmount",      "Tax Amount"),
            ("tax_amount",     "Tax Amount"),
            ("riskLevel",      "Risk Level"),
            ("risk_level",     "Risk Level"),
            ("riskScore",      "Risk Score"),
            ("risk_score",     "Risk Score"),
            ("confidence",     "Confidence"),
            ("status",         "Status"),
        ]

        rendered_labels = set()
        p.setFont("Helvetica", 11)
        for field, label in FIELD_MAP:
            if label in rendered_labels:
                continue
            val = doc.get(field)
            if val is None:
                continue
            rendered_labels.add(label)
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, y, f"{label}:")
            p.setFont("Helvetica", 10)
            p.drawString(180, y, str(val))
            y -= 18
            if y < 60:
                p.showPage()
                y = height - 60

        # Exceptions / flags
        flags = doc.get("exceptions") or doc.get("flags") or []
        if flags:
            y -= 10
            p.setFont("Helvetica-Bold", 11)
            p.drawString(50, y, "Exception Flags:")
            y -= 16
            p.setFont("Helvetica", 10)
            for flag in flags:
                line = f"  [{flag.get('severity','?')}] {flag.get('detail') or flag.get('check','')}"
                p.drawString(50, y, line[:90])
                y -= 14
                if y < 60:
                    p.showPage()
                    y = height - 60

        p.save()
        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=invoice_{invoice_id}_report.pdf"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")


@router.get("/invoices/{invoice_id}/csv", summary="Generate CSV export for invoice")
async def get_invoice_csv(invoice_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    try:
        try:
            obj_id = ObjectId(invoice_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid invoice ID format")

        doc = await db["invoices"].find_one({"_id": obj_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Invoice not found")

        # Convert ObjectId
        doc["_id"] = str(doc["_id"])

        # Use StringIO for csv then encode to bytes
        si = StringIO()
        writer = csv.writer(si)
        writer.writerow(doc.keys())
        writer.writerow([str(v) for v in doc.values()])
        output = BytesIO(si.getvalue().encode("utf-8"))
        output.seek(0)

        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=invoice_{invoice_id}_export.csv"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV generation failed: {e}")


@router.get("/invoices/{invoice_id}", response_model=Dict[str, Any], summary="Get invoice by ID or invoice number")
async def get_invoice(invoice_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    try:
        # Try invoice number fields first
        doc = await db["invoices"].find_one({"invoiceNumber": invoice_id})
        if not doc:
            doc = await db["invoices"].find_one({"invoice_number": invoice_id})
        if not doc:
            doc = await db["invoices"].find_one({"invoiceNo": invoice_id})
        # Fallback: treat as MongoDB ObjectId
        if not doc:
            try:
                obj_id = ObjectId(invoice_id)
                doc = await db["invoices"].find_one({"_id": obj_id})
            except Exception:
                pass
        if not doc:
            doc = await db["invoices"].find_one({"filename": {"$regex": invoice_id, "$options": "i"}}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Invoice not found")

        # Always convert ObjectId to string
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])

        # If gemini fields are not present on the invoice document, try audit results by filename
        if not doc.get("gemini_analysis") or not doc.get("risk_summary") or not doc.get("recommendations"):
            audit_doc = await db["audit_results"].find_one({"filename": doc.get("fileName") or doc.get("filename")})
        else:
            audit_doc = None

        risk_data = {
            "risk_score": doc.get("risk_score") or doc.get("risk", {}).get("risk_score") or doc.get("riskScore") or 0,
            "risk_level": doc.get("risk_level") or doc.get("risk", {}).get("risk_level") or doc.get("riskLevel") or "Low",
            "confidence": doc.get("confidence") or doc.get("risk", {}).get("confidence") or 0,
        }

        return {
            "invoice": doc,
            "risk": risk_data,
            "exceptions": doc.get("exceptions") or doc.get("flags") or [],
            "gemini_analysis": doc.get("gemini_analysis") or (audit_doc or {}).get("gemini_analysis") or doc.get("aiExplanation") or "",
            "recommendations": doc.get("recommendations") or (audit_doc or {}).get("recommendations") or "",
            "risk_summary": doc.get("risk_summary") or (audit_doc or {}).get("risk_summary") or doc.get("summary") or "",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")
