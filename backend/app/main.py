from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.router import api_router
from app.database.mongodb import init_mongodb, close_mongodb
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MongoDB connection on startup
    init_mongodb()
    yield
    # Close MongoDB connection on shutdown
    close_mongodb()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount upload directory as static files to allow access to scans
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "TETRA AI Risk Scanner Ingestion Engine",
        "version": "1.0.0",
        "docs_url": "/docs"
    }
