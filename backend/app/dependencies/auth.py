from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_access_token
from app.database.mongodb import get_database

security_required = HTTPBearer(auto_error=True)
security_optional = HTTPBearer(auto_error=False)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_required)):
    """
    Extracts the Bearer token, decodes it, and retrieves the user from MongoDB.
    Raises 401 if invalid.
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token content.",
        )
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection not initialized.",
        )
    user = await db["users"].find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in system record.",
        )
    # Expose ID as string
    user["id"] = str(user["_id"])
    return user

async def get_current_admin(current_user: dict = Depends(get_current_user)):
    """
    Verifies that the authenticated user is an administrator.
    Raises 403 if they are not.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to perform this action.",
        )
    return current_user

async def get_current_user_optional(credentials: HTTPAuthorizationCredentials = Depends(security_optional)):
    """
    Optional authentication dependency.
    If a Bearer token is present, verifies it and returns the user.
    If absent, returns a default system engine user context to maintain backward compatibility.
    """
    if not credentials:
        return {"id": "system", "email": "system@invexa.ai", "role": "admin", "full_name": "System Engine"}
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token.",
        )
    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token content.",
        )
    db = get_database()
    if db is None:
         return {"id": "system", "email": "system@invexa.ai", "role": "admin", "full_name": "System Engine"}
    
    user = await db["users"].find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in system record.",
        )
    user["id"] = str(user["_id"])
    return user
