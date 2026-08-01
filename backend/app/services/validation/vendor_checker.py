import re
import logging
from rapidfuzz import fuzz
from app.database.mongodb import get_database

logger = logging.getLogger("app.validation.vendor")

async def check_vendor(vendor_name: str, vendor_gstin: str) -> dict:
    """
    Validates vendor against MongoDB Atlas vendor_master collection.
    Matches using GSTIN and checks name similarity.
    """
    if not vendor_gstin:
        return {"valid": False, "reason": "vendor_not_found"}

    db = get_database()
    if db is None:
        logger.error("MongoDB connection not initialized in check_vendor.")
        return {"valid": False, "reason": "vendor_not_found"}

    # Query vendor_master by GSTIN (case-insensitive)
    query = {"gstin": {"$regex": f"^{re.escape(vendor_gstin.strip())}$", "$options": "i"}}
    cursor = db["vendor_master"].find(query)
    
    best_similarity = -1
    best_match_doc = None
    best_master_name = ""
    
    async for doc in cursor:
        master_name = doc.get("vendorName") or doc.get("name") or doc.get("vendor_name", "")
        similarity = fuzz.token_sort_ratio(
            str(vendor_name or "").lower(),
            str(master_name or "").lower()
        )
        if similarity > best_similarity:
            best_similarity = similarity
            best_match_doc = doc
            best_master_name = master_name

    if not best_match_doc:
        logger.warning(f"Vendor GSTIN {vendor_gstin} not found in database.")
        return {"valid": False, "reason": "vendor_not_found"}

    if best_similarity >= 70:
        logger.info(f"Vendor matched: GSTIN found, name similarity {best_similarity:.0f}%")
        return {"valid": True, "reason": "verified"}
    else:
        logger.warning(f"GSTIN found but vendor name mismatch: '{vendor_name}' vs '{best_master_name}' (similarity: {best_similarity:.0f}%)")
        return {"valid": False, "reason": "vendor_not_found"}
