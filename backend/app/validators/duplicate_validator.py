from typing import Dict, Any, List

def validate_duplicates(duplicates: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    issues = []
    
    # If more than 1 entry exists for this invoice number in invoices collection
    if len(duplicates) > 1:
        issues.append({
            "field": "invoiceNumber",
            "message": f"Duplicate invoice detected! ({len(duplicates)} matching instances found in database)",
            "severity": "High"
        })
        
    return issues
