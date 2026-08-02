from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime
from app.database.mongodb import get_database
from bson import ObjectId

router = APIRouter()


def _format_event(doc: dict) -> dict:
    """Format a MongoDB audit trail document for API response."""
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    if "invoice_id" in doc and doc["invoice_id"]:
        doc["invoice_id"] = str(doc["invoice_id"])
    if "timestamp" in doc and isinstance(doc["timestamp"], datetime):
        doc["timestamp"] = doc["timestamp"].isoformat()
    return doc


@router.get("/audit-trail", summary="Get audit trail logs with filters")
async def get_audit_trail(
    search: Optional[str] = Query(None, description="Search invoice number, vendor, event"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    status: Optional[str] = Query(None, description="Filter by status"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    module: Optional[str] = Query(None, description="Filter by module"),
    date_from: Optional[str] = Query(None, description="Start date ISO format"),
    date_to: Optional[str] = Query(None, description="End date ISO format"),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    db = get_database()
    if db is None:
        return {"events": [], "total": 0}

    try:
        query = {}

        if severity and severity != "ALL":
            query["severity"] = severity.upper()

        if status and status != "ALL":
            query["status"] = status.upper()

        if event_type and event_type != "ALL":
            query["event_type"] = event_type

        if module and module != "ALL":
            query["module"] = module

        if date_from:
            try:
                query.setdefault("timestamp", {})["$gte"] = datetime.fromisoformat(date_from.replace("Z", "+00:00"))
            except ValueError:
                pass

        if date_to:
            try:
                query.setdefault("timestamp", {})["$lte"] = datetime.fromisoformat(date_to.replace("Z", "+00:00"))
            except ValueError:
                pass

        if search:
            search_regex = {"$regex": search, "$options": "i"}
            search_conditions = [
                {"invoice_number": search_regex},
                {"title": search_regex},
                {"description": search_regex},
                {"event_type": search_regex},
                {"module": search_regex},
                {"performed_by": search_regex},
            ]
            if "$or" in query:
                query["$and"] = [{"$or": query.pop("$or")}, {"$or": search_conditions}]
            else:
                query["$or"] = search_conditions

        total = await db["audit_trail"].count_documents(query)
        cursor = db["audit_trail"].find(query).sort("timestamp", -1).skip(offset).limit(limit)
        events = await cursor.to_list(length=limit)

        return {
            "events": [_format_event(e) for e in events],
            "total": total,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")


@router.get("/audit-trail/recent", summary="Get last 50 audit trail events")
async def get_recent_audit_events():
    db = get_database()
    if db is None:
        return {"events": [], "total": 0}

    try:
        cursor = db["audit_trail"].find({}).sort("timestamp", -1).limit(50)
        events = await cursor.to_list(length=50)
        return {
            "events": [_format_event(e) for e in events],
            "total": len(events),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")


@router.get("/audit-trail/{invoice_id}", summary="Get audit trail for a specific invoice")
async def get_invoice_audit_trail(invoice_id: str, limit: int = 100):
    db = get_database()
    if db is None:
        return {"events": [], "total": 0}

    try:
        query = {"$or": [
            {"invoice_id": invoice_id},
            {"invoice_number": invoice_id},
        ]}
        total = await db["audit_trail"].count_documents(query)
        cursor = db["audit_trail"].find(query).sort("timestamp", -1).limit(limit)
        events = await cursor.to_list(length=limit)
        return {
            "events": [_format_event(e) for e in events],
            "total": total,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")
