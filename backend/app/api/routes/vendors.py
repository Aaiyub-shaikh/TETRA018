from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from app.database.mongodb import get_database
from app.dependencies.auth import get_current_user_optional
from datetime import datetime
from app.services.import_service import parse_file, map_vendor_columns

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


@router.post("/vendors/import", summary="Import vendors from CSV, Excel, or PDF")
async def import_vendors(file: UploadFile = File(...)):
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

        df = map_vendor_columns(df)

        rows_imported = 0
        duplicates_skipped = 0
        errors = 0

        for _, row in df.iterrows():
            try:
                vendor_name = str(row.get("vendor_name", "")).strip()
                gstin = str(row.get("gstin", "")).strip()

                if not vendor_name and not gstin:
                    errors += 1
                    continue

                # Skip duplicates by GSTIN
                if gstin:
                    existing = await db["vendor_master"].find_one({"gstin": gstin})
                    if existing:
                        duplicates_skipped += 1
                        continue

                doc = {
                    "vendor": vendor_name,
                    "gstin": gstin,
                    "email": str(row.get("email", "")).strip(),
                    "phone": str(row.get("phone", "")).strip(),
                    "address": str(row.get("address", "")).strip(),
                    "status": str(row.get("status", "Active")).strip() or "Active",
                    "created_at": datetime.utcnow().isoformat(),
                }
                await db["vendor_master"].insert_one(doc)
                rows_imported += 1
            except Exception:
                errors += 1

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
