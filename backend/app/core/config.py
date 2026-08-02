import os

try:
    from pydantic_settings import BaseSettings
    class Settings(BaseSettings):
        PROJECT_NAME: str = "Invexa AI"
        API_V1_STR: str = "/api"
        
        # Upload directories
        UPLOAD_DIR: str = "uploads"
        TEMP_DIR: str = "uploads/temp"
        PROCESSED_DIR: str = "uploads/processed"
        
        # PaddleOCR GPU/CPU
        USE_GPU: bool = False
        
        # Gemini API
        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        
        # MongoDB Atlas settings
        MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb+srv://parthgajjar1308_db_user:0vsYacOqmGzryqhe@cluster0.vdh9xmy.mongodb.net")
        DATABASE_NAME: str = os.getenv("DATABASE_NAME", "invoice_risk_scanner")

        # Email settings
        MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")
        MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
        MAIL_FROM: str = os.getenv("MAIL_FROM", "")
        MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
        MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
        MAIL_STARTTLS: bool = os.getenv("MAIL_STARTTLS", "True").lower() == "true"
        MAIL_SSL_TLS: bool = os.getenv("MAIL_SSL_TLS", "False").lower() == "true"
        
        class Config:
            env_file = ".env"
            case_sensitive = True
            extra = "ignore"

    settings = Settings()
except Exception:
    from dotenv import load_dotenv
    load_dotenv()
    
    class Settings:
        PROJECT_NAME: str = "Invexa AI"
        API_V1_STR: str = "/api"
        UPLOAD_DIR: str = "uploads"
        TEMP_DIR: str = "uploads/temp"
        PROCESSED_DIR: str = "uploads/processed"
        USE_GPU: bool = False
        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb+srv://parthgajjar1308_db_user:0vsYacOqmGzryqhe@cluster0.vdh9xmy.mongodb.net")
        DATABASE_NAME: str = os.getenv("DATABASE_NAME", "invoice_risk_scanner")
        MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")
        MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
        MAIL_FROM: str = os.getenv("MAIL_FROM", "")
        MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
        MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
        MAIL_STARTTLS: bool = os.getenv("MAIL_STARTTLS", "True").lower() == "true"
        MAIL_SSL_TLS: bool = os.getenv("MAIL_SSL_TLS", "False").lower() == "true"

    settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.TEMP_DIR, exist_ok=True)
os.makedirs(settings.PROCESSED_DIR, exist_ok=True)
