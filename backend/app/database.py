from pymongo import MongoClient
from app.config import settings

client = MongoClient(settings.MONGODB_URI)
db = client[settings.DATABASE_NAME]

invoice_collection = db["invoices"]
vendor_collection = db["vendor_master"]
ledger_collection = db["purchase_ledger"]
audit_collection = db["audit_results"]