from pymongo import MongoClient
from app.core.config import settings
from app.database.mongodb import get_database, init_mongodb, close_mongodb, db_helper

# Synchronous PyMongo client fallback for repository methods
client = MongoClient(settings.MONGODB_URI)
db = client[settings.DATABASE_NAME]

invoice_collection = db["invoices"]
vendor_collection = db["vendor_master"]
ledger_collection = db["purchase_ledger"]
audit_collection = db["audit_results"]
