from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import os
import uuid

from app.database.mongodb import get_database
from app.dependencies.auth import get_current_user
from app.core.security import verify_password, get_password_hash
from app.services.audit_trail.logger import log_event

router = APIRouter()


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    organization: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


@router.get("/profile", summary="Get current user profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    user_id = current_user.get("id")
    user = await db["users"].find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Build live account stats
    total_invoices = await db["invoices"].count_documents({})
    audit_cursor = db["audit_results"].find({})
    audit_docs = await audit_cursor.to_list(length=10000)
    high_risk = sum(1 for a in audit_docs if (a.get("riskScore") or 0) >= 75)
    total_reports = await db["reports"].count_documents({}) if "reports" in await db.list_collection_names() else 0
    total_emails = await db["email_logs"].count_documents({}) if "email_logs" in await db.list_collection_names() else 0

    # Recent activity
    recent_invoices_cursor = db["invoices"].find({}, {"_id": 0}).sort("_id", -1).limit(5)
    recent_invoices = await recent_invoices_cursor.to_list(length=5)

    recent_audit_cursor = db["audit_trail"].find({}, {"_id": 0}).sort("_id", -1).limit(5)
    recent_activity = await recent_audit_cursor.to_list(length=5)

    recent_emails_cursor = db["email_logs"].find({}, {"_id": 0}).sort("_id", -1).limit(5) if "email_logs" in await db.list_collection_names() else []
    if hasattr(recent_emails_cursor, '__aiter__'):
        recent_emails = await recent_emails_cursor.to_list(length=5)
    else:
        recent_emails = []

    # Last login from user doc or audit_trail
    last_login = user.get("last_login", "")
    if not last_login:
        login_cursor = db["audit_trail"].find({"event_type": "login"}, {"_id": 0}).sort("timestamp", -1).limit(1)
        login_events = await login_cursor.to_list(length=1)
        if login_events:
            last_login = login_events[0].get("timestamp", "")

    return {
        "id": str(user.get("_id", "")),
        "full_name": user.get("full_name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", ""),
        "phone": user.get("phone", ""),
        "department": user.get("department", ""),
        "designation": user.get("designation", ""),
        "organization": user.get("organization", ""),
        "employee_id": user.get("employee_id", ""),
        "profile_image": user.get("profile_image", ""),
        "joined_at": user.get("created_at", ""),
        "last_login": last_login,
        "account_status": user.get("account_status", "Active"),
        "stats": {
            "total_invoices_scanned": total_invoices,
            "high_risk_reviewed": high_risk,
            "reports_generated": total_reports,
            "emails_sent": total_emails,
            "last_activity": recent_activity[0].get("timestamp", "") if recent_activity else "",
        },
        "recent_invoices": recent_invoices,
        "recent_activity": recent_activity,
        "recent_emails": recent_emails,
    }


@router.put("/profile", summary="Update current user profile")
async def update_profile(payload: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    update_fields = {}
    if payload.full_name is not None:
        update_fields["full_name"] = payload.full_name
    if payload.phone is not None:
        update_fields["phone"] = payload.phone
    if payload.department is not None:
        update_fields["department"] = payload.department
    if payload.designation is not None:
        update_fields["designation"] = payload.designation
    if payload.organization is not None:
        update_fields["organization"] = payload.organization

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields["updated_at"] = datetime.utcnow().isoformat()

    await db["users"].update_one(
        {"email": current_user["email"]},
        {"$set": update_fields}
    )

    await log_event(
        event_type="profile_updated",
        title="Profile Updated",
        description=f"Profile fields updated: {', '.join(update_fields.keys())}",
        severity="INFO",
        status="SUCCESS",
        module="Profile",
        metadata={"updated_fields": list(update_fields.keys())},
    )

    return {"success": True, "message": "Profile updated successfully"}


@router.post("/profile/photo", summary="Upload profile photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    # Validate file type
    allowed = {"image/png", "image/jpeg", "image/jpg"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only PNG, JPG, JPEG files are allowed")

    # Read file
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 5MB")

    # Save file
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"profile_{current_user['email'].replace('@', '_')}_{uuid.uuid4().hex[:8]}.{ext}"
    upload_dir = os.path.join("uploads", "profiles")
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(content)

    relative_path = f"/static/uploads/profiles/{filename}"

    # Update user
    await db["users"].update_one(
        {"email": current_user["email"]},
        {"$set": {"profile_image": relative_path, "updated_at": datetime.utcnow().isoformat()}}
    )

    await log_event(
        event_type="profile_photo_updated",
        title="Profile Photo Updated",
        description="Profile picture was changed.",
        severity="INFO",
        status="SUCCESS",
        module="Profile",
        metadata={"filename": filename},
    )

    return {"success": True, "profile_image": relative_path}


@router.post("/profile/change-password", summary="Change user password")
async def change_password(payload: PasswordChange, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    user = await db["users"].find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(payload.current_password, user.get("password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    hashed = get_password_hash(payload.new_password)
    await db["users"].update_one(
        {"email": current_user["email"]},
        {"$set": {"password": hashed, "updated_at": datetime.utcnow().isoformat()}}
    )

    await log_event(
        event_type="password_changed",
        title="Password Changed",
        description="User password was changed successfully.",
        severity="INFO",
        status="SUCCESS",
        module="Profile",
    )

    return {"success": True, "message": "Password changed successfully"}
