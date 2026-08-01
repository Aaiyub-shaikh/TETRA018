from pydantic import BaseModel
from typing import Optional, List

class VendorSummary(BaseModel):
    gstin: Optional[str] = None
    name: Optional[str] = None
    status: Optional[str] = None
    risk_level: Optional[str] = None
    invoice_count: int = 0
    total_transaction_value: float = 0.0
