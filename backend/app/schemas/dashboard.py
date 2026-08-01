from pydantic import BaseModel
from typing import Optional

class DashboardStats(BaseModel):
    invoices_processed: int = 0
    risks_detected: int = 0
    pending_review: int = 0
    duplicate_invoices: int = 0
    gst_errors: int = 0
    ledger_mismatches: int = 0
