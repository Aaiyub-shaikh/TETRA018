from fastapi import APIRouter, HTTPException
from app.database.mongodb import get_database

router = APIRouter()

@router.get("/dashboard/stats", summary="Get dashboard metrics from MongoDB")
async def get_dashboard_stats():
    db = get_database()
    if db is None:
        return {
            "invoices_processed": 0,
            "risks_detected": 0,
            "pending_review": 0,
            "duplicate_invoices": 0,
            "gst_errors": 0,
            "ledger_mismatches": 0,
        }
    try:
        total = await db["invoices"].count_documents({})
        flagged = await db["invoices"].count_documents({"risk_level": {"$ne": "Low"}})
        pending = await db["invoices"].count_documents({"status": "Pending Review"})
        duplicates = await db["invoices"].count_documents({"status": "Duplicate"})
        gst_errors = await db["invoices"].count_documents({"status": "GST Mismatch"})
        ledger_mismatches = await db["invoices"].count_documents({"status": "Ledger Missing"})
        
        return {
            "invoices_processed": total,
            "risks_detected": flagged,
            "pending_review": pending,
            "duplicate_invoices": duplicates,
            "gst_errors": gst_errors,
            "ledger_mismatches": ledger_mismatches,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")
