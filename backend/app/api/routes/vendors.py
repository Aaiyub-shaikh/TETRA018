from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.database.mongodb import get_database
from app.dependencies.auth import get_current_user_optional
from datetime import datetime

router = APIRouter()

class VendorCreate(BaseModel):
    vendor: str
    gstin: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    address: Optional[str] = ""

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

@router.post("/vendors", summary="Add a new vendor to master")
async def add_vendor(vendor: VendorCreate, current_user: dict = Depends(get_current_user_optional)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    try:
        existing = await db["vendor_master"].find_one({"gstin": vendor.gstin})
        if existing:
            raise HTTPException(status_code=409, detail=f"Vendor with GSTIN {vendor.gstin} already exists")
        doc = vendor.model_dump()
        doc["created_at"] = datetime.utcnow().isoformat()
        await db["vendor_master"].insert_one(doc)
        doc.pop("_id", None)
        return {"success": True, "message": "Vendor added successfully", "vendor": doc}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to insert vendor: {e}")
