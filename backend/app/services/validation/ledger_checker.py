import re
import logging
from app.database.mongodb import get_database

logger = logging.getLogger("app.validation.ledger")

async def check_ledger(invoice_number: str) -> dict:
    """
    Queries the purchase_ledger collection in MongoDB Atlas.
    Supports both camelCase 'invoiceNumber' and snake_case 'invoice_number'.
    """
    if not invoice_number:
        return {"found": False, "document": None, "reason": "Invoice number is empty"}

    db = get_database()
    if db is None:
        logger.error("MongoDB connection not initialized in check_ledger.")
        return {"found": False, "document": None, "reason": "Database connection not initialized"}

    # Query with case-insensitive regex for the invoice number
    regex_match = {"$regex": f"^{re.escape(invoice_number.strip())}$", "$options": "i"}
    
    # Check both keys in case schemas differ across documents
    query = {
        "$or": [
            {"invoiceNumber": regex_match},
            {"invoice_number": regex_match}
        ]
    }
    
    doc = await db["purchase_ledger"].find_one(query)

    if doc:
        # Convert _id to string for JSON compatibility
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        logger.info(f"Invoice {invoice_number} found in purchase_ledger.")
        return {"found": True, "document": doc, "reason": "Found matching entry in purchase ledger"}
    else:
        logger.warning(f"Invoice {invoice_number} not found in purchase_ledger.")
        return {"found": False, "document": None, "reason": f"Invoice {invoice_number} not found in purchase ledger"}
