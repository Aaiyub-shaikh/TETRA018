import re

def clean_amount_str(amount_str: str) -> float:
    # Remove commas, spaces, currency indicators, and other characters
    cleaned = re.sub(r'[^\d\.]', '', amount_str)
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def extract_amounts(text: str) -> dict:
    """
    Extracts taxable value, tax amount, and grand total from text.
    Handles optional decimals, commas, and arbitrary spacing/symbols (e.g. 'n' or '■').
    """
    taxable_amount = 0.0
    tax_amount = 0.0
    total_amount = 0.0

    # Pattern explanation: 
    # Match label (e.g. Total, GST, Taxable), followed by any non-digit connector sequence (except newlines),
    # followed by numbers with commas and optional decimals.
    
    # 1. Extract Grand Total
    total_patterns = [
        r'(?:Grand\s*)?Total\s*[^0-9\n]*\s*([\d,]+(?:\.\d+)?)(?!\s*\%)',
        r'Total\s*amount\s*\(in\s*words\).*?([\d,]+(?:\.\d+)?)(?!\s*\%)',
    ]
    for pattern in total_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            total_amount = clean_amount_str(match.group(1))
            break

    # 2. Extract Taxable Value
    taxable_patterns = [
        r'(?:Taxable\s*(?:Amount|Value))\s*[^0-9\n]*\s*([\d,]+(?:\.\d+)?)(?!\s*\%)',
    ]
    for pattern in taxable_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            taxable_amount = clean_amount_str(match.group(1))
            break

    # 3. Extract Tax Amount (Sum of GST items or direct GST line)
    # Search for GST line first, e.g. "GST n 9,000" or "GST ■ 9,000"
    gst_match = re.search(r'\b(?:GST|CGST\s*\+\s*SGST|IGST)\b\s*[^0-9\n]*\s*([\d,]+(?:\.\d+)?)(?!\s*\%)', text, re.IGNORECASE)
    if gst_match:
        tax_amount = clean_amount_str(gst_match.group(1))
    else:
        # Fallback: sum individual tax components
        cgst_matches = re.findall(r'CGST\s*\d*(?:\.\d+)?%?\s*[^0-9\n]*\s*([\d,]+(?:\.\d+)?)(?!\s*\%)', text, re.IGNORECASE)
        sgst_matches = re.findall(r'SGST\s*\d*(?:\.\d+)?%?\s*[^0-9\n]*\s*([\d,]+(?:\.\d+)?)(?!\s*\%)', text, re.IGNORECASE)
        igst_matches = re.findall(r'IGST\s*\d*(?:\.\d+)?%?\s*[^0-9\n]*\s*([\d,]+(?:\.\d+)?)(?!\s*\%)', text, re.IGNORECASE)
        
        cgst = sum(clean_amount_str(m) for m in cgst_matches)
        sgst = sum(clean_amount_str(m) for m in sgst_matches)
        igst = sum(clean_amount_str(m) for m in igst_matches)
        tax_amount = cgst + sgst + igst

    # 4. Math consistency fallbacks
    if total_amount > 0 and taxable_amount == 0:
        if tax_amount > 0:
            taxable_amount = total_amount - tax_amount
        else:
            # Assume standard 18% default rate if not stated
            taxable_amount = round(total_amount / 1.18, 2)
            tax_amount = round(total_amount - taxable_amount, 2)
    elif taxable_amount > 0 and tax_amount > 0 and total_amount == 0:
        total_amount = taxable_amount + tax_amount

    return {
        "taxable_amount": taxable_amount,
        "tax_amount": tax_amount,
        "total_amount": total_amount
    }
