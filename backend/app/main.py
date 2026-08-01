import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.router import api_router
from app.database.mongodb import init_mongodb, close_mongodb, seed_users

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MongoDB connection on startup
    init_mongodb()
    # Seed default users
    await seed_users()
    yield
    # Close MongoDB connection on shutdown
    close_mongodb()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Invoice Risk Scanner - Full Ingestion, OCR & Audit Engine API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS for Next.js frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include main API router under settings.API_V1_STR ("/api")
app.include_router(api_router, prefix=settings.API_V1_STR)

# Also mount api_router without prefix so /api/v1/audit works seamlessly
app.include_router(api_router)

# Mount upload directory as static files to allow access to scan images/PDFs
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "AI-Powered Invoice Risk Scanner API",
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "auditEndpoint": "/api/v1/audit/{invoice_number}"
    }

@app.get("/health", tags=["Health Check"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
# Trigger uvicorn reload with clean markdown narrative rendering


