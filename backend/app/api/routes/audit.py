from fastapi import APIRouter, HTTPException
from app.database.mongodb import get_database

router = APIRouter()

@router.get("/audit", summary="Get audit logs from MongoDB")
async def get_audit_trail(limit: int = 50):
    db = get_database()
    if db is None:
        return {"events": [], "total": 0}
    try:
        cursor = db["audit_results"].find({}, {"_id": 0}).sort("timestamp", -1).limit(limit)
        events = await cursor.to_list(length=limit)
        return {"events": events, "total": len(events)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")
