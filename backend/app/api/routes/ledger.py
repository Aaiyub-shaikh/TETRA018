from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.database.mongodb import get_database
from app.dependencies.auth import get_current_user_optional
from datetime import datetime

router = APIRouter()

class LedgerEntry(BaseModel):
    invoiceNo: str
    vendor: str
    gstin: Optional[str] = ""
    invoiceDate: Optional[str] = ""
    invoiceSum: float = 0.0
    taxAmount: Optional[float] = 0.0

@router.get("/ledger", summary="List all purchase ledger entries")
async def list_ledger():
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

        return {"entries": entries, "total": len(entries)}
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
