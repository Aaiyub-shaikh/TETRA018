from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AuditIssue(BaseModel):
    field: str = Field(..., description="Field name where anomaly was detected")
    message: str = Field(..., description="Human readable issue description")
    severity: str = Field(..., description="High, Medium, or Low")

class ValidationCheck(BaseModel):
    name: str = Field(..., description="Name of validation check")
    status: str = Field(..., description="PASS or FAIL")

class RiskDetails(BaseModel):
    score: int = Field(..., description="Risk score 0-100")
    level: str = Field(..., description="Low, Medium, or High")
    confidence: int = Field(..., description="Confidence score percentage (e.g. 95)")

class AuditResultData(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    invoiceNumber: str
    vendorName: str
    gstin: Optional[str] = None
    invoiceDate: Optional[str] = None
    totalAmount: Optional[float] = None
    
    # Nested Dashboard Ready Models
    risk: RiskDetails
    summary: str = Field(..., description="Short headline summary")
    aiExplanation: str = Field(..., description="Full forensic auditor AI narrative")
    checks: List[ValidationCheck] = []
    issues: List[AuditIssue] = []
    
    # Backward compatibility flat properties
    riskScore: int
    riskLevel: str
    confidence: int
    auditedAt: Optional[str] = None

    class Config:
        populate_by_name = True

class AuditResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[AuditResultData] = None

class DirectAuditRequest(BaseModel):
    invoiceNumber: str
    vendorName: str
    gstin: Optional[str] = None
    invoiceDate: Optional[str] = None
    totalAmount: Optional[float] = None
