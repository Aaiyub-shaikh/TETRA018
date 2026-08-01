import re

GSTIN_PATTERN = r'\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Zz]{1}[A-Z\d]{1}'

def extract_gstins(text: str):
    """
    Finds all unique GSTINs in the invoice text.
    """
    matches = re.findall(GSTIN_PATTERN, text)
    unique_gstins = list(dict.fromkeys(matches)) # Preserve order, remove duplicates
    
    vendor_gstin = None
    customer_gstin = None
    
    if len(unique_gstins) > 0:
        vendor_gstin = unique_gstins[0]
    if len(unique_gstins) > 1:
        customer_gstin = unique_gstins[1]
        
    return {
        "vendor_gstin": vendor_gstin,
        "customer_gstin": customer_gstin,
        "all_gstins": unique_gstins
    }
