from fastapi import APIRouter

router = APIRouter()

@router.get("/reports", summary="List generated reports")
def list_reports():
    return {"reports": [], "total": 0}

@router.get("/reports/summary", summary="Aggregate risk summary report")
def get_summary():
    return {
        "high_risk_count": 0,
        "medium_risk_count": 0,
        "low_risk_count": 0,
        "total_flags": 0
    }
