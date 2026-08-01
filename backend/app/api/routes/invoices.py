from fastapi import APIRouter, HTTPException
from app.database.mongodb import get_database

router = APIRouter()

@router.get("/invoices", summary="List all processed invoices")
async def list_invoices():
    db = get_database()
    if db is None:
        return {"invoices": [], "total": 0}
    try:
        cursor = db["invoices"].find({}, {"_id": 0}).sort("upload_time", -1)
        invoices = await cursor.to_list(length=100)
        return {"invoices": invoices, "total": len(invoices)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")

@router.get("/invoices/{invoice_id}", summary="Get invoice by number")
async def get_invoice(invoice_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    try:
        doc = await db["invoices"].find_one({"invoice_number": invoice_id}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")
