from fastapi import APIRouter, HTTPException
from app.database.mongodb import get_database

router = APIRouter()

@router.get("/vendors", summary="List all vendors from master")
async def list_vendors():
    db = get_database()
    if db is None:
        return {"vendors": [], "total": 0}
    try:
        cursor = db["vendor_master"].find({}, {"_id": 0})
        vendors = await cursor.to_list(length=100)
        return {"vendors": vendors, "total": len(vendors)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")

@router.get("/vendors/{vendor_id}", summary="Get vendor by GSTIN")
async def get_vendor(vendor_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    try:
        doc = await db["vendor_master"].find_one({"gstin": vendor_id}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Vendor not found")
        return doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")
