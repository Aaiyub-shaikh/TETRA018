from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from app.database import (
    invoice_collection,
    vendor_collection,
    ledger_collection,
    audit_collection,
)

class AuditRepository:
    def get_invoice_by_number(self, invoice_number: str) -> Optional[Dict[str, Any]]:
        return invoice_collection.find_one({"invoiceNumber": invoice_number})

    def get_vendor_by_name(self, vendor_name: str) -> Optional[Dict[str, Any]]:
        if not vendor_name:
            return None
        # Try exact match first
        vendor = vendor_collection.find_one({"vendorName": vendor_name})
        if not vendor:
            # Case-insensitive fallback
            vendor = vendor_collection.find_one({
                "vendorName": {"$regex": f"^{vendor_name}$", "$options": "i"}
            })
        return vendor

    def get_ledger_by_invoice_number(self, invoice_number: str) -> Optional[Dict[str, Any]]:
        return ledger_collection.find_one({"invoiceNumber": invoice_number})

    def find_duplicate_invoices(
        self, invoice_number: str, gstin: Optional[str] = None, total_amount: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Find duplicate invoices by invoiceNumber OR by matching vendor GSTIN + amount combination.
        """
        query = {"invoiceNumber": invoice_number}
        duplicates = list(invoice_collection.find(query))

        # If gstin and amount provided, also check for duplicate amounts for same GSTIN
        if gstin and total_amount:
            secondary_duplicates = list(invoice_collection.find({
                "gstin": gstin,
                "totalAmount": total_amount,
                "invoiceNumber": {"$ne": invoice_number}
            }))
            duplicates.extend(secondary_duplicates)

        return duplicates

    def save_audit_result(self, result_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Saves audit result to MongoDB and returns a clean dictionary without raw ObjectId.
        """
        record = dict(result_data)
        record["auditedAt"] = datetime.now(timezone.utc).isoformat()
        
        insert_res = audit_collection.insert_one(record)
        
        # Convert _id to string for JSON safety
        record["_id"] = str(insert_res.inserted_id)
        return record

    def get_audit_result(self, invoice_number: str) -> Optional[Dict[str, Any]]:
        result = audit_collection.find_one({"invoiceNumber": invoice_number}, sort=[("auditedAt", -1)])
        if result and "_id" in result:
            result["_id"] = str(result["_id"])
        return result

audit_repository = AuditRepository()
