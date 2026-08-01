from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from bson import ObjectId
from datetime import datetime

from app.database.mongodb import get_database
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token, RoleUpdate
from app.dependencies.auth import get_current_user, get_current_admin

router = APIRouter()

@router.post("/login", response_model=Token, summary="Authenticate user credentials and return access token")
async def login(credentials: UserLogin):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    user = await db["users"].find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid corporate email or security password."
        )
    
    if not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid corporate email or security password."
        )
    
    access_token = create_access_token(data={"sub": user["email"], "role": user.get("role", "compliance_officer")})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user["email"],
            "full_name": user.get("full_name", "Officer"),
            "role": user.get("role", "compliance_officer")
        }
    }

@router.post("/register", response_model=UserResponse, summary="Register a new compliance user (Admin-only)")
async def register(new_user: UserCreate, current_admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Check if role is valid
    if new_user.role not in ["admin", "compliance_officer", "auditor"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role selected. Allowed roles are: admin, compliance_officer, auditor."
        )
        
    existing = await db["users"].find_one({"email": new_user.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email {new_user.email} already exists."
        )
        
    user_doc = {
        "email": new_user.email,
        "password": get_password_hash(new_user.password),
        "full_name": new_user.full_name,
        "role": new_user.role,
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = await db["users"].insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)
    return user_doc

@router.get("/me", response_model=UserResponse, summary="Retrieve details of currently logged-in user")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "full_name": current_user.get("full_name", ""),
        "role": current_user.get("role", ""),
        "created_at": current_user.get("created_at", "")
    }

@router.get("/users", response_model=List[UserResponse], summary="List all registered compliance users (Admin-only)")
async def list_users(current_admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    cursor = db["users"].find({})
    users = await cursor.to_list(length=100)
    
    res = []
    for user in users:
        res.append({
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "role": user.get("role", ""),
            "created_at": user.get("created_at", "")
        })
    return res

@router.put("/users/{user_id}/role", response_model=UserResponse, summary="Update a user's administrative role (Admin-only)")
async def update_user_role(user_id: str, payload: RoleUpdate, current_admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    if payload.role not in ["admin", "compliance_officer", "auditor"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role selected."
        )
        
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format."
        )
        
    # Prevent self-demotion
    if str(current_admin["_id"]) == user_id and payload.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own administrative role."
        )
        
    user = await db["users"].find_one({"_id": obj_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    await db["users"].update_one(
        {"_id": obj_id},
        {"$set": {"role": payload.role}}
    )
    
    updated_user = await db["users"].find_one({"_id": obj_id})
    updated_user["id"] = str(updated_user["_id"])
    return updated_user

@router.delete("/users/{user_id}", summary="Delete a compliance user account (Admin-only)")
async def delete_user(user_id: str, current_admin: dict = Depends(get_current_admin)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format."
        )
        
    # Prevent self-deletion
    if str(current_admin["_id"]) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own administrative account."
        )
        
    user = await db["users"].find_one({"_id": obj_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    await db["users"].delete_one({"_id": obj_id})
    return {"success": True, "message": "User deleted successfully."}
