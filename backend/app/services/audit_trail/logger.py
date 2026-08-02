import logging
from datetime import datetime
from typing import Optional, Any
from app.database.mongodb import get_database

logger = logging.getLogger("app.audit_trail")


async def log_event(
    invoice_id: Optional[str] = None,
    invoice_number: Optional[str] = None,
    event_type: str = "",
    title: str = "",
    description: str = "",
    severity: str = "INFO",
    status: str = "SUCCESS",
    module: str = "",
    performed_by: str = "System",
    metadata: Optional[dict] = None,
):
    """Write a single audit trail event to MongoDB."""
    db = get_database()
    if db is None:
        logger.warning("MongoDB not available, skipping audit trail log")
        return

    doc = {
        "invoice_id": invoice_id,
        "invoice_number": invoice_number or "",
        "event_type": event_type,
        "title": title,
        "description": description,
        "status": status,
        "severity": severity,
        "module": module,
        "performed_by": performed_by,
        "timestamp": datetime.utcnow(),
        "metadata": metadata or {},
    }

    try:
        await db["audit_trail"].insert_one(doc)
    except Exception as e:
        logger.error(f"Failed to write audit trail event: {e}")
