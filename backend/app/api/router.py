from fastapi import APIRouter
from app.api.routes import health, upload, invoices, vendors, dashboard, reports, audit

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(upload.router, tags=["Ingestion"])
api_router.include_router(invoices.router, tags=["Invoices"])
api_router.include_router(vendors.router, tags=["Vendors"])
api_router.include_router(dashboard.router, tags=["Dashboard"])
api_router.include_router(reports.router, tags=["Reports"])
api_router.include_router(audit.router, prefix="/v1/audit", tags=["Audit Engine"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit Trail"], include_in_schema=False)
