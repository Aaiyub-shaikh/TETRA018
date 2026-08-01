import os
import time
import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.config import settings
from app.services.parser.invoice_parser import parse_invoice
from app.services.risk.risk_engine import run_risk_engine
from app.schemas.invoice import InvoiceAnalysisResponse
from app.database.mongodb import get_database

logger = logging.getLogger("app.routes.upload")

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"}
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

    # 5. Connect to MongoDB Atlas and insert results
    db = get_database()
    if db is not None:
        try:
            # Insert audit result
            audit_doc = {
                "filename": filename,
                "raw_text": raw_text,
                "extracted_fields": fields,
                "exceptions": risk_result.get("flags", []),
                "risk": {
                    "risk_score": risk_result.get("risk_score", 0.0),
                    "risk_level": risk_result.get("risk_level", "Low"),
                    "confidence": risk_result.get("confidence", 100.0)
                },
                "timestamp": datetime.utcnow().isoformat(),
                "processing_time": processing_time,
                "confidence": risk_result.get("confidence", 100.0)
            }
            await db["audit_results"].insert_one(audit_doc)
            logger.info("Successfully saved result to audit_results collection.")

            # Map status based on risk level
            risk_level = risk_result.get("risk_level", "Low")
            if risk_level == "Low":
                status = "Verified"
            elif risk_level == "Medium":
                status = "Pending Review"
            else:
                status = "High Risk"

            # Insert metadata into invoices
            invoice_doc = {
                "filename": filename,
                "upload_time": datetime.utcnow().isoformat(),
                "invoice_number": fields.get("invoice_number"),
                "vendor": fields.get("vendor_name"),
                "total": fields.get("total_amount"),
                "risk_level": risk_level,
                "status": status
            }
            await db["invoices"].insert_one(invoice_doc)
            logger.info("Successfully saved metadata to invoices collection.")

        except Exception as db_err:
            logger.error(f"Failed to record execution logs in MongoDB Atlas: {db_err}")
            # Do not crash the response if logging fails, but alert in logs
    else:
        logger.error("MongoDB Atlas connection not available. Skipping DB save.")

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
        }
    )
