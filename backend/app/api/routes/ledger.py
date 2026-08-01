from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database.mongodb import get_database
from datetime import datetime

router = APIRouter()

class LedgerEntry(BaseModel):
    invoiceNumber: str
    vendorName: str
    gstin: Optional[str] = ""
    invoiceDate: Optional[str] = ""
    amount: float = 0.0
    taxAmount: Optional[float] = 0.0
    status: Optional[str] = "Recorded"

@router.get("/ledger", summary="List all purchase ledger entries")
async def list_ledger():
    db = get_database()
    if db is None:
        return {"entries": [], "total": 0}
    try:
        cursor = db["purchase_ledger"].find({}, {"_id": 0}).sort("invoiceDate", -1)
        entries = await cursor.to_list(length=200)
        return {"entries": entries, "total": len(entries)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")

@router.post("/ledger", summary="Add a new ledger entry")
async def add_ledger_entry(entry: LedgerEntry):
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
