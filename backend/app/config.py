from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "invoice_risk_scanner")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()

# Exports for direct imports
MONGODB_URI = settings.MONGODB_URI
DATABASE_NAME = settings.DATABASE_NAME
GEMINI_API_KEY = settings.GEMINI_API_KEY