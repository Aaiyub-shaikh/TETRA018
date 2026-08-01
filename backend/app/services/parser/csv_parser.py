import csv
import os
import logging
from typing import Dict, Any, List

logger = logging.getLogger("app.parser.csv")

# Column name aliases — maps common CSV headers to our internal field names
COLUMN_ALIASES = {
    # Invoice number
    "invoice_number": "invoice_number",
    "invoice no": "invoice_number",
    "invoice_no": "invoice_number",
    "invoicenumber": "invoice_number",
    "inv_no": "invoice_number",
    "inv number": "invoice_number",
    "bill number": "invoice_number",
    "bill_no": "invoice_number",

    # Vendor
    "vendor_name": "vendor_name",
    "vendor": "vendor_name",
    "vendorname": "vendor_name",
    "supplier": "vendor_name",
    "supplier_name": "vendor_name",
    "from": "vendor_name",
    "billed by": "vendor_name",
    "company": "vendor_name",

    # GSTIN
    "vendor_gstin": "vendor_gstin",
    "gstin": "vendor_gstin",
    "tax_id": "vendor_gstin",
    "tax identification number": "vendor_gstin",
    "gst no": "vendor_gstin",
    "gst_number": "vendor_gstin",

    # Date
    "date": "date",
    "invoice_date": "date",
    "invoicedate": "date",
    "invoice date": "date",
    "bill_date": "date",
    "bill date": "date",
    "transaction_date": "date",
    "created_at": "date",

    # Amounts
    "taxable_amount": "taxable_amount",
    "taxableamount": "taxable_amount",
    "taxable value": "taxable_amount",
    "taxable_value": "taxable_amount",
    "subtotal": "taxable_amount",
    "sub_total": "taxable_amount",
    "base_amount": "taxable_amount",

    "tax_amount": "tax_amount",
    "taxamount": "tax_amount",
    "tax": "tax_amount",
    "gst_amount": "tax_amount",
    "gst amount": "tax_amount",
    "tax_amount_gst": "tax_amount",

    "total_amount": "total_amount",
    "totalamount": "total_amount",
    "total": "total_amount",
    "grand_total": "total_amount",
    "grand total": "total_amount",
    "amount": "total_amount",
    "invoice_total": "total_amount",
    "net_amount": "total_amount",
    "net amount": "total_amount",
    "sum": "total_amount",

    # Place of supply
    "place_of_supply": "place_of_supply",
    "placeofsupply": "place_of_supply",
    "pos": "place_of_supply",
    "state": "place_of_supply",
    "supply_state": "place_of_supply",

    # Customer GSTIN
    "customer_gstin": "customer_gstin",
    "buyer_gstin": "customer_gstin",
    "recipient_gstin": "customer_gstin",
}


def _normalize_column_name(col: str) -> str:
    """Normalize a CSV column name to our internal field name."""
    normalized = col.strip().lower().replace("-", " ").replace("_", " ")
    return COLUMN_ALIASES.get(normalized, normalized.replace(" ", "_"))


def _parse_amount(value: str) -> float:
    """Parse a currency string like '₹1,667.00' or '1667.00' into a float."""
    if not value:
        return 0.0
    cleaned = str(value).replace("₹", "").replace(",", "").replace("INR", "").replace("Rs.", "").replace("Rs", "").strip()
    try:
        return float(cleaned)
    except (ValueError, TypeError):
        return 0.0


def _clean_text(value: str) -> str:
    """Clean a text value from CSV."""
    if not value:
        return ""
    return str(value).strip().strip('"').strip("'")


def parse_csv(file_path: str) -> Dict[str, Any]:
    """
    Parse a CSV file containing invoice data.

    Supports two formats:
    1. Multi-row: each row is a separate invoice (columns = fields)
    2. Single-row/key-value: two columns (key, value) representing one invoice

    Returns the first invoice as a unified field dict.
    """
    try:
        # Detect encoding and delimiter
        with open(file_path, "r", encoding="utf-8-sig") as f:
            sample = f.read(4096)

        # Detect delimiter
        sniffer = csv.Sniffer()
        try:
            dialect = sniffer.sniff(sample)
            delimiter = dialect.delimiter
        except csv.Error:
            delimiter = ","

        # Read CSV
        with open(file_path, "r", encoding="utf-8-sig", newline="") as f:
            reader = csv.reader(f, delimiter=delimiter)
            rows = list(reader)

        if not rows:
            return {"success": False, "error": "CSV file is empty", "fields": {}}

        # Remove empty rows
        rows = [row for row in rows if any(cell.strip() for cell in row)]
        if not rows:
            return {"success": False, "error": "CSV file has no data rows", "fields": {}}

        header = [_normalize_column_name(col) for col in rows[0]]

        # Check if this is a key-value format (2 columns, data rows have labels in first col)
        is_kv_format = False
        if len(header) == 2:
            # Check if first column values look like field labels
            sample_keys = [_normalize_column_name(row[0]) for row in rows[1:4] if row]
            label_keywords = ["invoice", "vendor", "date", "amount", "total", "gstin", "tax", "supplier", "bill", "pos", "state"]
            if any(
                any(kw in key for kw in label_keywords)
                for key in sample_keys
            ):
                is_kv_format = True

        if is_kv_format:
            # Key-value format: extract single invoice
            fields = {}
            for row in rows[1:]:
                if len(row) >= 2:
                    key = _normalize_column_name(row[0])
                    value = _clean_text(row[1])
                    if key in COLUMN_ALIASES.values():
                        fields[key] = value
            return {"success": True, "fields": _finalize_fields(fields)}

        # Multi-row format: use first data row
        if len(rows) < 2:
            return {"success": False, "error": "CSV has header but no data rows", "fields": {}}

        data_row = rows[1]
        fields = {}
        for i, col_name in enumerate(header):
            if i < len(data_row):
                value = _clean_text(data_row[i])
                if col_name in COLUMN_ALIASES.values():
                    fields[col_name] = value

        # Parse numeric fields
        for num_field in ["taxable_amount", "tax_amount", "total_amount"]:
            if num_field in fields:
                fields[num_field] = _parse_amount(fields[num_field])

        return {"success": True, "fields": _finalize_fields(fields)}

    except Exception as e:
        logger.error(f"CSV parsing failed: {e}")
        return {"success": False, "error": f"Failed to parse CSV: {str(e)}", "fields": {}}


def _finalize_fields(fields: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure all required fields have defaults."""
    return {
        "invoice_number": fields.get("invoice_number", ""),
        "vendor_name": fields.get("vendor_name", ""),
        "vendor_gstin": fields.get("vendor_gstin", ""),
        "customer_gstin": fields.get("customer_gstin", ""),
        "date": fields.get("date", ""),
        "taxable_amount": float(fields.get("taxable_amount", 0.0) or 0.0),
        "tax_amount": float(fields.get("tax_amount", 0.0) or 0.0),
        "total_amount": float(fields.get("total_amount", 0.0) or 0.0),
        "place_of_supply": fields.get("place_of_supply", ""),
    }
