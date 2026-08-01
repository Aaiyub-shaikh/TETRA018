import os

try:
    from pydantic_settings import BaseSettings
    class Settings(BaseSettings):
        PROJECT_NAME: str = "TETRA AI Risk Scanner"
        API_V1_STR: str = "/api"
        
        # Upload directories
        UPLOAD_DIR: str = "uploads"
        TEMP_DIR: str = "uploads/temp"
        PROCESSED_DIR: str = "uploads/processed"
        
        # PaddleOCR GPU/CPU
        USE_GPU: bool = False
        
        # MongoDB Atlas settings
        MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb+srv://parthgajjar1308_db_user:0vsYacOqmGzryqhe@cluster0.vdh9xmy.mongodb.net")
        DATABASE_NAME: str = os.getenv("DATABASE_NAME", "invoice_risk_scanner")
        
        class Config:
            env_file = ".env"
            case_sensitive = True
            extra = "ignore"

    settings = Settings()
except Exception:
    from dotenv import load_dotenv
    load_dotenv()
    
    class Settings:
        PROJECT_NAME: str = "TETRA AI Risk Scanner"
        API_V1_STR: str = "/api"
        UPLOAD_DIR: str = "uploads"
        TEMP_DIR: str = "uploads/temp"
        PROCESSED_DIR: str = "uploads/processed"
        USE_GPU: bool = False
        MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb+srv://parthgajjar1308_db_user:0vsYacOqmGzryqhe@cluster0.vdh9xmy.mongodb.net")
        DATABASE_NAME: str = os.getenv("DATABASE_NAME", "invoice_risk_scanner")

    settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.TEMP_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
