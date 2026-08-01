from pydantic import BaseModel, Field
from typing import Optional, List, Any

class ExtractedFields(BaseModel):
    invoice_number: Optional[str] = None
    date: Optional[str] = None
    vendor_gstin: Optional[str] = None
    customer_gstin: Optional[str] = None
    all_gstins: List[str] = []
    vendor_name: Optional[str] = None
    taxable_amount: float = 0.0
    tax_amount: float = 0.0
    total_amount: float = 0.0
    place_of_supply: Optional[str] = None

class RiskFlag(BaseModel):
    check: str
    severity: str
    detail: str

class RiskAssessment(BaseModel):
    risk_score: float
    risk_level: str
    confidence: float
    flags: List[RiskFlag] = []
    flag_count: int = 0
    summary: Optional[str] = None
    ai_explanation: Optional[str] = None


class InvoiceAnalysisResponse(BaseModel):
    success: bool
    filename: str
    file_size_kb: float
    extraction_method: str
    page_count: int
    raw_text_preview: str  # First 500 chars
    fields: ExtractedFields
    risk: RiskAssessment
