import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def main():
    uri = "mongodb+srv://parthgajjar1308_db_user:0vsYacOqmGzryqhe@cluster0.vdh9xmy.mongodb.net"
    db_name = "invoice_risk_scanner"
    
    print("=" * 60)
    print("TETRA AI — MongoDB Atlas Diagnostics")
    print("=" * 60)
    
    try:
        client = AsyncIOMotorClient(uri)
        db = client[db_name]
        
        # Test connection
        await client.admin.command('ping')
        print("[PASS] Successfully pinged MongoDB Atlas server.")
        
        # List collections
        collections = await db.list_collection_names()
        print(f"Collections present: {collections}")
        
        # Count collections
        for col_name in ["vendor_master", "purchase_ledger", "invoices", "audit_results"]:
            count = await db[col_name].count_documents({})
            print(f"  - Collection '{col_name}': {count} documents")
            
    except Exception as e:
        print(f"[FAIL] MongoDB connection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
