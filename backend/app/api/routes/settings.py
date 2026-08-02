from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database.mongodb import get_database
from app.dependencies.auth import get_current_user
from app.services.audit_trail.logger import log_event

router = APIRouter()

DEFAULT_SETTINGS = {
    "organization": "Invexa AI",
    "currency": "INR",
    "timezone": "Asia/Kolkata",
    "date_format": "DD/MM/YYYY",
    "language": "English",
    "ai": {
        "enabled": True,
        "model": "gemini-2.5-flash",
        "temperature": 0.3,
        "max_tokens": 2048,
        "prompt_style": "Professional",
    },
    "ocr": {
        "engine": "Tesseract",
        "language": "English",
        "confidence": 90,
        "image_enhancement": True,
        "auto_rotation": False,
    },
    "risk": {
        "threshold": 70,
        "duplicate_detection": True,
        "gst_validation": True,
        "vendor_validation": True,
        "ledger_matching": True,
    },
    "email": {
        "smtp_server": "",
        "smtp_port": 587,
        "sender_email": "",
        "reply_email": "",
        "notifications_enabled": False,
        "auto_send_report": False,
    },
    "notifications": {
        "browser_notifications": True,
        "email_alerts": True,
        "invoice_completion": True,
        "risk_alerts": True,
    },
    "security": {
        "session_timeout": 60,
        "two_factor_enabled": False,
    },
}


@router.get("/settings", summary="Get application settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    doc = await db["settings"].find_one({"_type": "app_settings"})
    if not doc:
        # Create default settings
        default = DEFAULT_SETTINGS.copy()
        default["_type"] = "app_settings"
        default["updated_at"] = datetime.utcnow().isoformat()
        default["updated_by"] = current_user.get("email", "")
        result = await db["settings"].insert_one(default)
        default["_id"] = str(result.inserted_id)
        return default

    doc["_id"] = str(doc["_id"])
    return doc


@router.put("/settings", summary="Update application settings")
async def update_settings(payload: dict, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    # Remove _id if present
    payload.pop("_id", None)
    payload.pop("_type", None)
    payload.pop("updated_by", None)

    payload["updated_at"] = datetime.utcnow().isoformat()
    payload["updated_by"] = current_user.get("email", "")

    existing = await db["settings"].find_one({"_type": "app_settings"})
    if existing:
        await db["settings"].update_one(
            {"_type": "app_settings"},
            {"$set": payload}
        )
    else:
        payload["_type"] = "app_settings"
        await db["settings"].insert_one(payload)

    await log_event(
        event_type="settings_updated",
        title="Settings Updated",
        description=f"Application settings were updated by {current_user.get('email', 'unknown')}.",
        severity="INFO",
        status="SUCCESS",
        module="Settings",
        metadata={"updated_by": current_user.get("email", "")},
    )

    return {"success": True, "message": "Settings saved successfully"}
