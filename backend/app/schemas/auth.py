from pydantic import BaseModel, Field
from typing import Optional

class UserCreate(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    full_name: str
    role: str = Field(default="compliance_officer")

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: str

class TokenUser(BaseModel):
    email: str
    full_name: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: TokenUser

class RoleUpdate(BaseModel):
    role: str = Field(..., description="The new role to assign to the user, e.g. admin, compliance_officer, auditor")
