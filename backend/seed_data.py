"""
Seed script to insert sample invoices, vendor master, and purchase ledger records into MongoDB Atlas.
Run this script via: python backend/seed_data.py
"""
import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import invoice_collection, vendor_collection, ledger_collection

def seed():
    print("[Seed] Seeding MongoDB Atlas collections for AI Invoice Risk Scanner...")

    # 1. Seed Vendor Master
    vendors = [
        {
            "vendorName": "Acme Technologies Pvt Ltd",
            "gstin": "27AAACA1234A1Z5",
            "status": "Active",
            "city": "Mumbai"
        },
        {
            "vendorName": "Apex Logistics Services",
            "gstin": "07BBBBB5678B1Z2",
            "status": "Inactive",
            "city": "Delhi"
        },
        {
            "vendorName": "Global Steel Supplies",
            "gstin": "29CCCCC9012C1Z8",
            "status": "Active",
            "city": "Bengaluru"
        }
    ]

    for v in vendors:
        vendor_collection.update_one(
            {"vendorName": v["vendorName"]},
            {"$set": v},
            upsert=True
        )
    print(f"[Seed] Vendor Master seeded ({len(vendors)} vendors).")

    # 2. Seed Purchase Ledger
    ledger_entries = [
        {
            "invoiceNumber": "INV-2026-001",
            "vendorName": "Acme Technologies Pvt Ltd",
            "invoiceDate": "2026-07-15",
            "amount": 150000.0,
            "status": "APPROVED"
        },
        {
            "invoiceNumber": "INV-2026-002",
            "vendorName": "Apex Logistics Services",
            "invoiceDate": "2026-07-18",
            "amount": 45000.0,
            "status": "PENDING"
        }
    ]

    for l in ledger_entries:
        ledger_collection.update_one(
            {"invoiceNumber": l["invoiceNumber"]},
            {"$set": l},
            upsert=True
        )
    print(f"[Seed] Purchase Ledger seeded ({len(ledger_entries)} entries).")

    # 3. Seed Extracted Invoices
    invoices = [
        # Invoice 1: Clean invoice (Low Risk)
        {
            "invoiceNumber": "INV-2026-001",
            "vendorName": "Acme Technologies Pvt Ltd",
            "gstin": "27AAACA1234A1Z5",
            "invoiceDate": "2026-07-15",
            "totalAmount": 150000.0
        },
        # Invoice 2: High Risk (Mismatched amount, Inactive vendor, invalid GSTIN)
        {
            "invoiceNumber": "INV-2026-002",
            "vendorName": "Apex Logistics Services",
            "gstin": "INVALID_GST_FORMAT",
            "invoiceDate": "2026-07-20",  # Date mismatch (Ledger has 2026-07-18)
            "totalAmount": 99000.0        # Amount mismatch (Ledger has 45000.0)
        },
        # Invoice 3: Missing from Purchase Ledger
        {
            "invoiceNumber": "INV-2026-003",
            "vendorName": "Global Steel Supplies",
            "gstin": "29CCCCC9012C1Z8",
            "invoiceDate": "2026-07-25",
            "totalAmount": 250000.0
        }
    ]

    for inv in invoices:
        invoice_collection.update_one(
            {"invoiceNumber": inv["invoiceNumber"]},
            {"$set": inv},
            upsert=True
        )
    print(f"[Seed] Invoices collection seeded ({len(invoices)} invoices).")
    print("[Seed] Seeding completed successfully!")

if __name__ == "__main__":
    seed()
