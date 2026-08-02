from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from app.database.mongodb import get_database
from app.dependencies.auth import get_current_user_optional
from datetime import datetime
from app.services.import_service import parse_file, map_ledger_columns
from app.services.audit_trail.logger import log_event

router = APIRouter()

class LedgerEntry(BaseModel):
    invoiceNo: str
    vendor: str
    gstin: Optional[str] = ""
    invoiceDate: Optional[str] = ""
    invoiceSum: float = 0.0
    taxAmount: Optional[float] = 0.0

@router.get("/ledger", summary="List all purchase ledger entries")
async def list_ledger(
    page: int = 1,
    page_size: int = 10
):
    db = get_database()
    if db is None:
        return {"entries": [], "total": 0}
    try:
        cursor = db["purchase_ledger"].find({}, {"_id": 0}).sort("invoiceDate", -1)
        entries = await cursor.to_list(length=200)

        # Build lookup from audit_results by invoiceNumber
        audit_cursor = db["audit_results"].find({})
        audit_docs = await audit_cursor.to_list(length=1000)
        audit_map = {}
        for a in audit_docs:
            inv_no = a.get("invoiceNumber")
            if inv_no:
                audit_map[inv_no] = a

        # Also get invoice status map
        inv_cursor = db["invoices"].find({})
        inv_docs = await inv_cursor.to_list(length=1000)
        inv_map = {}
        for inv in inv_docs:
            inv_no = inv.get("invoiceNumber")
            if inv_no:
                inv_map[inv_no] = inv

        for entry in entries:
            inv_no = entry.get("invoiceNo", "")
            audit = audit_map.get(inv_no)
            inv = inv_map.get(inv_no)

            if not audit and not inv:
                entry["status"] = "No Match"
                continue

            issues = (audit or {}).get("issues") or []
            exceptions = (audit or {}).get("exceptions") or []
            risk_score = (audit or {}).get("riskScore") or 0

            # Normalize issues to text
            issue_texts = []
            for item in issues:
                if isinstance(item, dict):
                    issue_texts.append((item.get("message") or item.get("field") or "").lower())
                else:
                    issue_texts.append(str(item).lower())

            check_texts = []
            for ex in exceptions:
                if isinstance(ex, dict):
                    check_texts.append((ex.get("check") or "").lower())
                else:
                    check_texts.append(str(ex).lower())

            all_texts = issue_texts + check_texts

            has_amount = any("amount" in t for t in all_texts)
            has_date = any("date" in t for t in all_texts)
            has_vendor = any("vendor" in t for t in all_texts)
            has_gstin = any("gstin" in t or "gst" in t for t in all_texts)
            has_ledger_missing = any("ledger" in t or "purchase ledger" in t for t in all_texts)
            has_duplicate = any("duplicate" in t for t in all_texts)

            # Determine status
            if risk_score >= 75 or has_duplicate or has_ledger_missing:
                entry["status"] = "Variance Flag"
            elif has_amount or has_date or has_vendor or has_gstin:
                entry["status"] = "Variance Flag"
            else:
                entry["status"] = "Reconciled"

        total = len(entries)
        paginated = entries[(page - 1) * page_size : page * page_size]
        return {"entries": paginated, "total": total, "page": page, "page_size": page_size, "total_pages": (total + page_size - 1) // page_size}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")

@router.post("/ledger", summary="Add a new ledger entry")
async def add_ledger_entry(entry: LedgerEntry, current_user: dict = Depends(get_current_user_optional)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    try:
        doc = entry.model_dump()
        doc["created_at"] = datetime.utcnow().isoformat()
        await db["purchase_ledger"].insert_one(doc)
        doc.pop("_id", None)
        return {"success": True, "message": "Ledger entry added successfully", "entry": doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to insert ledger entry: {e}")


@router.post("/ledger/import", summary="Import ledger entries from CSV, Excel, or PDF")
async def import_ledger(file: UploadFile = File(...)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    try:
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file")

        df = parse_file(file_bytes, file.filename)
        if df.empty:
            raise HTTPException(status_code=400, detail="No table data found in file")

        df = map_ledger_columns(df)

        rows_imported = 0
        duplicates_skipped = 0
        errors = 0

        for _, row in df.iterrows():
            try:
                invoice_no = str(row.get("invoice_no", "")).strip()
                vendor = str(row.get("vendor", "")).strip()
                gstin = str(row.get("gstin", "")).strip()

                if not invoice_no:
                    errors += 1
                    continue

                # Skip duplicates by invoice_no + gstin
                existing = await db["purchase_ledger"].find_one({
                    "invoiceNo": invoice_no,
                    "gstin": gstin
                })
                if existing:
                    duplicates_skipped += 1
                    continue

                def safe_float(val):
                    try:
                        if not val:
                            return 0.0
                        return float(str(val).replace(",", "").replace("₹", "").replace("Rs", "").strip())
                    except (ValueError, TypeError):
                        return 0.0

                doc = {
                    "invoiceNo": invoice_no,
                    "vendor": vendor,
                    "gstin": gstin,
                    "invoiceDate": str(row.get("invoice_date", "")).strip(),
                    "invoiceSum": safe_float(row.get("total_amount")),
                    "taxAmount": safe_float(row.get("tax_amount")),
                    "created_at": datetime.utcnow().isoformat(),
                }
                await db["purchase_ledger"].insert_one(doc)
                rows_imported += 1
            except Exception:
                errors += 1

        await log_event(
            event_type="ledger_imported",
            title="Purchase Ledger Imported",
            description=f"Ledger import completed: {rows_imported} added, {duplicates_skipped} duplicates skipped.",
            severity="INFO",
            status="SUCCESS",
            module="Ledger Import",
            metadata={"rows_imported": rows_imported, "duplicates_skipped": duplicates_skipped, "errors": errors},
        )

        return {
            "success": True,
            "rows_imported": rows_imported,
            "duplicates_skipped": duplicates_skipped,
            "errors": errors,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {e}")
