import re
import logging
from app.database.mongodb import get_database

logger = logging.getLogger("app.validation.duplicate")

async def check_duplicate(invoice_number: str) -> dict:
    """
    Checks if an invoice number is a duplicate by querying the invoices collection.
    If count >= 1, it's flagged as a duplicate.
    """
    if not invoice_number:
        return {"is_duplicate": False, "reason": "Invoice number is empty"}

    db = get_database()
    if db is None:
        logger.error("MongoDB connection not initialized in check_duplicate.")
        return {"is_duplicate": False, "reason": "Database connection not initialized"}

    # Search invoices collection by invoice_number (case-insensitive exact match)
    query = {"invoice_number": {"$regex": f"^{re.escape(invoice_number.strip())}$", "$options": "i"}}
    count = await db["invoices"].count_documents(query)

    if count >= 1:
        logger.warning(f"Duplicate invoice detected: {invoice_number} (found {count} records)")
        return {
            "is_duplicate": True,
            "reason": f"Duplicate Invoice: invoice {invoice_number} already processed."
        }

    return {"is_duplicate": False, "reason": "No duplicate found"}
