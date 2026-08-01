from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.audit import router as audit_router

app = FastAPI(
    title="AI-Powered Invoice Risk Scanner - Audit Engine API",
    description="Backend API for invoice risk calculation, ledger/vendor master cross-validation, and Gemini AI explanation generation.",
    version="1.0.0"
)

# Configure CORS for Next.js frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Audit Router
app.include_router(audit_router)

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "AI-Powered Invoice Risk Scanner - Audit Engine API",
        "status": "online",
        "docs": "/docs",
        "health": "/health",
        "auditEndpoint": "/api/v1/audit/{invoice_number}"
    }

@app.get("/health", tags=["Health Check"])
def health_check():
    return {
        "status": "healthy",
        "service": "Invoice Risk Scanner Audit Engine",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)