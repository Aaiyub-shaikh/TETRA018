import os
import time
import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.config import settings
from app.services.parser.invoice_parser import parse_invoice
from app.services.risk.risk_engine import run_risk_engine
from app.services.gemini_service import generate_ai_explanation
from app.schemas.invoice import InvoiceAnalysisResponse
from app.database.mongodb import get_database

logger = logging.getLogger("app.routes.upload")

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp", ".csv"}
MAX_FILE_SIZE_MB = 20

@router.post("/upload", response_model=InvoiceAnalysisResponse, summary="Upload and analyze an invoice")
async def upload_invoice(file: UploadFile = File(...)):
    """
    Upload an invoice (PDF/Image) and perform validation using MongoDB Atlas.
    Inserts audit results and invoice metadata in real-time.
    """
    start_time = time.time()
    
    # 1. Validate file extension
    filename = file.filename or "invoice"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # 2. Save uploaded file to uploads/invoices
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    save_path = os.path.join(settings.UPLOAD_DIR, "invoices", unique_name)
    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    try:
        with open(save_path, "wb") as f:
            contents = await file.read()
            f.write(contents)
    except Exception as e:
        logger.error(f"Failed to save uploaded file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save uploaded file")

    file_size_kb = round(os.path.getsize(save_path) / 1024, 2)

    # Enforce max file size
    if file_size_kb > MAX_FILE_SIZE_MB * 1024:
        os.remove(save_path)
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({file_size_kb:.0f} KB). Max allowed: {MAX_FILE_SIZE_MB} MB"
        )

    logger.info(f"File saved at {save_path} ({file_size_kb} KB)")

    # 3. Extract text (pdfplumber -> PyMuPDF -> OCR fallback) and fields
    try:
        parse_result = parse_invoice(save_path)
    except Exception as e:
        logger.error(f"Parsing failed: {e}")
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=500, detail=f"Invoice parsing failed: {str(e)}")

    if not parse_result.get("success"):
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(
            status_code=422,
            detail=parse_result.get("error", "Invoice could not be parsed")
        )

    fields = parse_result.get("fields", {})
    raw_text = parse_result.get("raw_text", "")
    extraction_method = parse_result.get("extraction_method", "unknown")
    page_count = parse_result.get("page_count", 1)

    # 4. Perform database checks & run risk engine (asynchronously querying Atlas)
    try:
        risk_result = await run_risk_engine(fields)
    except Exception as e:
        logger.error(f"Risk engine execution failed: {e}")
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=500, detail=f"Compliance check failed: {str(e)}")

    processing_time = round(time.time() - start_time, 3)

    invoice_context = {
        "invoiceNumber": fields.get("invoice_number"),
        "vendorName": fields.get("vendor_name"),
        "gstin": fields.get("vendor_gstin"),
        "invoiceDate": fields.get("date"),
        "totalAmount": fields.get("total_amount", 0.0),
    }
    risk_summary, gemini_analysis, recommendations = generate_ai_explanation(
        invoice=invoice_context,
        issues=risk_result.get("flags", []),
        risk_score=risk_result.get("risk_score", 0.0),
        risk_level=risk_result.get("risk_level", "Low"),
    )

    # 5. Connect to MongoDB Atlas and insert results
    db = get_database()
    if db is not None:
        try:
            # Insert audit result
            audit_doc = {
                "filename": filename,
                "raw_text": raw_text,
                "created_at": datetime.utcnow().isoformat(),
                "timestamp": datetime.utcnow().isoformat(),
                "processing_time": processing_time,
                "extracted_fields": fields,
                "exceptions": risk_result.get("flags", []),
                "risk_score": risk_result.get("risk_score", 0.0),
                "risk_level": risk_result.get("risk_level", "Low"),
                "confidence": risk_result.get("confidence", 100.0),
                "summary": risk_result.get("summary", ""),
                "ai_explanation": risk_result.get("ai_explanation", ""),
                "risk": {
                    "risk_score": risk_result.get("risk_score", 0.0),
                    "risk_level": risk_result.get("risk_level", "Low"),
                    "confidence": risk_result.get("confidence", 100.0),
                    "summary": risk_result.get("summary", ""),
                    "ai_explanation": risk_result.get("ai_explanation", "")
                },
                "risk_summary": risk_summary,
                "gemini_analysis": gemini_analysis,
                "recommendations": recommendations,
                "summary": risk_summary,
                "aiExplanation": gemini_analysis,
            }
            audit_result = await db["audit_results"].insert_one(audit_doc)
            logger.info("Successfully saved result to audit_results collection.")

            # Map status based on risk level
            risk_level = risk_result.get("risk_level", "Low")
            if risk_level == "Low":
                status = "Verified"
            elif risk_level == "Medium":
                status = "Pending Review"
            else:
                status = "High Risk"

            # Insert metadata into invoices (aligned with MongoDB collection schema)
            invoice_doc = {
                "fileName": filename,
                "filename": filename,
                "upload_time": datetime.utcnow().isoformat(),
                "uploadTime": datetime.utcnow().isoformat(),
                "created_at": datetime.utcnow().isoformat(),
                "createdAt": datetime.utcnow().isoformat(),
                "invoiceNumber": fields.get("invoice_number"),
                "invoice_number": fields.get("invoice_number"),
                "vendorName": fields.get("vendor_name"),
                "vendor": fields.get("vendor_name"),
                "gstin": fields.get("vendor_gstin"),
                "vendor_gstin": fields.get("vendor_gstin"),
                "customer_gstin": fields.get("customer_gstin"),
                "invoiceDate": fields.get("date"),
                "invoice_date": fields.get("date"),
                "due_date": fields.get("due_date"),
                "dueDate": fields.get("due_date"),
                "taxableValue": fields.get("taxable_amount", 0.0),
                "taxable_amount": fields.get("taxable_amount", 0.0),
                "taxAmount": fields.get("tax_amount", 0.0),
                "tax_amount": fields.get("tax_amount", 0.0),
                "totalAmount": fields.get("total_amount", 0.0),
                "total": fields.get("total_amount", 0.0),
                "total_amount": fields.get("total_amount", 0.0),
                "place_of_supply": fields.get("place_of_supply"),
                "riskLevel": risk_level,
                "risk_level": risk_level,
                "riskScore": risk_result.get("risk_score", 0.0),
                "risk_score": risk_result.get("risk_score", 0.0),
                "confidence": risk_result.get("confidence", 100.0),
                "status": status,
                "flagCount": risk_result.get("flag_count", 0),
                "flag_count": risk_result.get("flag_count", 0),
                "exceptions": risk_result.get("flags", []),
                "summary": risk_result.get("summary", ""),
                "ai_explanation": risk_result.get("ai_explanation", ""),
                "raw_text": raw_text,
                "risk_summary": risk_summary,
                "gemini_analysis": gemini_analysis,
                "recommendations": recommendations,
            }
            invoice_result = await db["invoices"].insert_one(invoice_doc)
            logger.info("Successfully saved metadata to invoices collection.")

        except Exception as db_err:
            logger.error(f"Failed to record execution logs in MongoDB Atlas: {db_err}")
            # Do not crash the response if logging fails, but alert in logs
    else:
        logger.error("MongoDB Atlas connection not available. Skipping DB save.")

    invoice_context = {
        "invoiceNumber": fields.get("invoice_number"),
        "vendorName": fields.get("vendor_name"),
        "gstin": fields.get("vendor_gstin"),
        "invoiceDate": fields.get("date"),
        "totalAmount": fields.get("total_amount", 0.0),
    }
    risk_summary, gemini_analysis, recommendations = generate_ai_explanation(
        invoice=invoice_context,
        issues=risk_result.get("flags", []),
        risk_score=risk_result.get("risk_score", 0.0),
        risk_level=risk_result.get("risk_level", "Low"),
    )

    # Store Gemini output back into the audit result and invoice document if the DB insertion succeeded
    if db is not None:
        try:
            if 'audit_result' in locals() and audit_result.inserted_id:
                await db["audit_results"].update_one(
                    {"_id": audit_result.inserted_id},
                    {"$set": {
                        "risk_summary": risk_summary,
                        "gemini_analysis": gemini_analysis,
                        "recommendations": recommendations,
                        "summary": risk_summary,
                        "aiExplanation": gemini_analysis
                    }}
                )
            if 'invoice_result' in locals() and invoice_result.inserted_id:
                await db["invoices"].update_one(
                    {"_id": invoice_result.inserted_id},
                    {"$set": {
                        "risk_summary": risk_summary,
                        "gemini_analysis": gemini_analysis,
                        "recommendations": recommendations
                    }}
                )
        except Exception as db_err:
            logger.error(f"Failed to update Gemini fields in MongoDB Atlas: {db_err}")

    # Cleanup the file from local storage as it is fully processed and results are saved
    if os.path.exists(save_path):
        try:
            os.remove(save_path)
        except Exception:
            pass

    return InvoiceAnalysisResponse(
        success=True,
        filename=filename,
        file_size_kb=file_size_kb,
        extraction_method=extraction_method,
        page_count=page_count,
        raw_text_preview=raw_text[:500],
        fields=fields,
        risk={
            "risk_score": risk_result.get("risk_score", 0.0),
            "risk_level": risk_result.get("risk_level", "Low"),
            "confidence": risk_result.get("confidence", 100.0),
            "flags": risk_result.get("flags", []),
            "flag_count": risk_result.get("flag_count", 0),
            "summary": risk_result.get("summary", ""),
            "ai_explanation": risk_result.get("ai_explanation", ""),
        },
        risk_summary=risk_summary,
        gemini_analysis=gemini_analysis,
        recommendations=recommendations,
    )
