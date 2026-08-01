from fastapi import APIRouter, HTTPException
from app.database.mongodb import get_database
from app.services.risk.risk_engine import run_risk_engine

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
            doc = await db["invoices"].find_one({"filename": {"$regex": invoice_id, "$options": "i"}}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Enrich on-the-fly if ai_explanation or summary is missing
        if not doc.get("ai_explanation") or not doc.get("summary"):
            try:
                from app.services.gemini_service import generate_ai_explanation
                exceptions = doc.get("exceptions", [])
                score = doc.get("risk_score", 0)
                level = doc.get("risk_level", "Low")
                summary, ai_explanation = generate_ai_explanation(doc, exceptions, score, level)
                doc["summary"] = summary
                doc["ai_explanation"] = ai_explanation
            except Exception:
                pass

        return doc

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")
