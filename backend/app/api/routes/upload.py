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
from app.services.risk_explainer import generate_risk_explanations
from app.services.audit_trail.logger import log_event
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

    await log_event(
        event_type="invoice_uploaded",
        title="Invoice Uploaded",
        description=f"File '{filename}' uploaded ({file_size_kb} KB).",
        severity="INFO",
        status="SUCCESS",
        module="Upload",
        metadata={"filename": filename, "file_size_kb": file_size_kb},
    )

    # 3. Extract text (pdfplumber -> PyMuPDF -> OCR fallback) and fields
    try:
        parse_result = parse_invoice(save_path)
    except Exception as e:
        logger.error(f"Parsing failed: {e}")
        await log_event(
            event_type="ocr_failed",
            title="OCR Failed",
            description=f"Parsing failed for '{filename}': {str(e)}",
            severity="CRITICAL",
            status="FAILED",
            module="OCR",
            metadata={"filename": filename, "error": str(e)},
        )
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

    inv_num = fields.get("invoice_number", "")
    await log_event(
        event_type="ocr_completed",
        title="OCR Completed",
        description=f"Text extracted via {extraction_method}. Confidence fields parsed.",
        severity="INFO",
        status="SUCCESS",
        module="OCR",
        invoice_number=inv_num,
        metadata={"extraction_method": extraction_method, "page_count": page_count, "text_length": len(raw_text)},
    )

    await log_event(
        event_type="fields_extracted",
        title="Fields Extracted",
        description=f"Invoice number: {inv_num or 'N/A'}, vendor: {fields.get('vendor_name', 'N/A')}.",
        severity="INFO",
        status="SUCCESS",
        module="Extraction",
        invoice_number=inv_num,
        metadata={"fields": {k: v for k, v in fields.items() if v}},
    )

    # 4. Perform database checks & run risk engine (asynchronously querying Atlas)
    try:
        risk_result = await run_risk_engine(fields)
    except Exception as e:
        logger.error(f"Risk engine execution failed: {e}")
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=500, detail=f"Compliance check failed: {str(e)}")

    processing_time = round(time.time() - start_time, 3)

    risk_level = risk_result.get("risk_level", "Low")
    risk_score = risk_result.get("risk_score", 0.0)
    flags = risk_result.get("flags", [])
    flag_count = risk_result.get("flag_count", 0)

    # Log individual validation events
    validation = risk_result.get("validation_details") or {}
    if validation.get("duplicate"):
        await log_event(
            event_type="duplicate_check",
            title="Duplicate Check",
            description=f"Duplicate invoice detected for {inv_num}.",
            severity="HIGH",
            status="WARNING",
            module="Validation",
            invoice_number=inv_num,
            metadata=validation.get("duplicate"),
        )
    if validation.get("gst") is not None:
        gst_ok = validation["gst"].get("valid", True) if isinstance(validation["gst"], dict) else True
        await log_event(
            event_type="gst_validation",
            title="GST Validation",
            description=f"GSTIN validated for {inv_num}.",
            severity="INFO" if gst_ok else "WARNING",
            status="SUCCESS" if gst_ok else "FAILED",
            module="Validation",
            invoice_number=inv_num,
            metadata=validation.get("gst") if isinstance(validation.get("gst"), dict) else {},
        )
    if validation.get("amount"):
        await log_event(
            event_type="amount_validation",
            title="Amount Validation",
            description=f"Amount validated for {inv_num}.",
            severity="INFO",
            status="SUCCESS",
            module="Validation",
            invoice_number=inv_num,
            metadata=validation.get("amount") if isinstance(validation.get("amount"), dict) else {},
        )
    if validation.get("date"):
        await log_event(
            event_type="date_validation",
            title="Date Validation",
            description=f"Date validated for {inv_num}.",
            severity="INFO",
            status="SUCCESS",
            module="Validation",
            invoice_number=inv_num,
            metadata=validation.get("date") if isinstance(validation.get("date"), dict) else {},
        )
    if validation.get("vendor"):
        await log_event(
            event_type="vendor_verification",
            title="Vendor Verification",
            description=f"Vendor verified for {inv_num}.",
            severity="INFO",
            status="SUCCESS",
            module="Validation",
            invoice_number=inv_num,
            metadata=validation.get("vendor") if isinstance(validation.get("vendor"), dict) else {},
        )
    if validation.get("ledger"):
        await log_event(
            event_type="ledger_comparison",
            title="Ledger Comparison",
            description=f"Ledger compared for {inv_num}.",
            severity="INFO",
            status="SUCCESS",
            module="Validation",
            invoice_number=inv_num,
            metadata=validation.get("ledger") if isinstance(validation.get("ledger"), dict) else {},
        )

    await log_event(
        event_type="risk_score_generated",
        title="Risk Score Generated",
        description=f"Risk score: {risk_score}% ({risk_level}). {flag_count} flag(s) detected.",
        severity="HIGH" if risk_level in ("High", "Critical") else ("WARNING" if risk_level == "Medium" else "INFO"),
        status="SUCCESS",
        module="Risk Engine",
        invoice_number=inv_num,
        metadata={"risk_score": risk_score, "risk_level": risk_level, "flag_count": flag_count, "flags": [f.get("check", str(f)) if isinstance(f, dict) else str(f) for f in flags]},
    )

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

    # Generate detailed risk explanations for each flag
    risk_explanations = generate_risk_explanations(
        invoice=fields,
        flags=risk_result.get("flags", []),
        risk_score=risk_result.get("risk_score", 0.0),
        risk_level=risk_result.get("risk_level", "Low"),
        validation_details=risk_result.get("validation_details"),
    )

    await log_event(
        event_type="gemini_analysis_completed",
        title="Gemini Analysis Completed",
        description=f"AI explanation generated for {inv_num}.",
        severity="INFO",
        status="SUCCESS",
        module="AI Analysis",
        invoice_number=inv_num,
        metadata={"risk_summary_length": len(risk_summary), "analysis_length": len(gemini_analysis)},
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
                "risk_explanations": risk_explanations,
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

            await log_event(
                event_type="invoice_stored",
                title="Invoice Stored",
                description=f"Invoice {inv_num} stored in database.",
                severity="INFO",
                status="SUCCESS",
                module="Storage",
                invoice_number=inv_num,
                metadata={"processing_time_s": processing_time},
            )

        except Exception as db_err:
            logger.error(f"Failed to record execution logs in MongoDB Atlas: {db_err}")
            await log_event(
                event_type="storage_failed",
                title="Storage Failed",
                description=f"Failed to store invoice {inv_num}: {str(db_err)}",
                severity="CRITICAL",
                status="FAILED",
                module="Storage",
                invoice_number=inv_num,
                metadata={"error": str(db_err)},
            )
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
        risk_explanations=risk_explanations,
    )

    await log_event(
        event_type="invoice_analysis_completed",
        title="Invoice Analysis Completed",
        description=f"Full analysis completed for {inv_num} in {processing_time}s.",
        severity="INFO",
        status="SUCCESS",
        module="Pipeline",
        invoice_number=inv_num,
        metadata={"processing_time_s": processing_time, "extraction_method": extraction_method},
    )
