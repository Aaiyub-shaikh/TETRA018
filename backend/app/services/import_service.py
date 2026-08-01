import pandas as pd
import io
import tempfile
import os
from typing import List, Dict, Any, Tuple


def parse_csv(file_bytes: bytes) -> pd.DataFrame:
    """Parse CSV file bytes into a DataFrame."""
    return pd.read_csv(io.BytesIO(file_bytes))


def parse_excel(file_bytes: bytes) -> pd.DataFrame:
    """Parse Excel file bytes into a DataFrame."""
    return pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")


def parse_pdf(file_bytes: bytes) -> pd.DataFrame:
    """Parse PDF table data into a DataFrame. Falls back to PyMuPDF if pdfplumber fails."""
    # Try pdfplumber first
    try:
        import pdfplumber
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        try:
            with pdfplumber.open(tmp_path) as pdf:
                all_rows = []
                headers = None
                for page in pdf.pages:
                    tables = page.extract_tables()
                    for table in tables:
                        if not table:
                            continue
                        for i, row in enumerate(table):
                            if i == 0 and headers is None:
                                headers = [str(c).strip() if c else "" for c in row]
                            else:
                                cleaned = [str(c).strip() if c else "" for c in row]
                                if headers and len(cleaned) == len(headers):
                                    all_rows.append(cleaned)
                if headers and all_rows:
                    return pd.DataFrame(all_rows, columns=headers)
        finally:
            os.unlink(tmp_path)
    except Exception:
        pass

    # Fallback to PyMuPDF
    try:
        import fitz  # PyMuPDF
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        try:
            doc = fitz.open(tmp_path)
            all_rows = []
            headers = None
            for page in doc:
                tabs = page.find_tables()
                for tab in tabs:
                    data = tab.extract()
                    if not data:
                        continue
                    for i, row in enumerate(data):
                        if i == 0 and headers is None:
                            headers = [str(c).strip() if c else "" for c in row]
                        else:
                            cleaned = [str(c).strip() if c else "" for c in row]
                            if headers and len(cleaned) == len(headers):
                                all_rows.append(cleaned)
            if headers and all_rows:
                return pd.DataFrame(all_rows, columns=headers)
        finally:
            os.unlink(tmp_path)
    except Exception:
        pass

    return pd.DataFrame()


def parse_file(file_bytes: bytes, filename: str) -> pd.DataFrame:
    """Parse file based on extension."""
    lower = filename.lower()
    if lower.endswith(".csv"):
        return parse_csv(file_bytes)
    elif lower.endswith((".xlsx", ".xls")):
        return parse_excel(file_bytes)
    elif lower.endswith(".pdf"):
        return parse_pdf(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {filename}")


# ─── Vendor Column Mapping ────────────────────────────────────────────────────

VENDOR_COLUMN_MAP = {
    "vendor": "vendor_name",
    "vendor name": "vendor_name",
    "supplier": "vendor_name",
    "supplier name": "vendor_name",
    "vendor_name": "vendor_name",
    "gstin": "gstin",
    "gst": "gstin",
    "vendor gstin": "gstin",
    "vendor_gstin": "gstin",
    "phone": "phone",
    "mobile": "phone",
    "email": "email",
    "address": "address",
    "status": "status",
}

VENDOR_FIELDS = ["vendor_name", "gstin", "phone", "email", "address", "status"]


def map_vendor_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Map raw column names to standard vendor fields."""
    rename = {}
    for col in df.columns:
        key = str(col).strip().lower()
        if key in VENDOR_COLUMN_MAP:
            rename[col] = VENDOR_COLUMN_MAP[key]
    df = df.rename(columns=rename)
    return df


# ─── Ledger Column Mapping ────────────────────────────────────────────────────

LEDGER_COLUMN_MAP = {
    "invoice no": "invoice_no",
    "invoice number": "invoice_no",
    "bill number": "invoice_no",
    "invoiceno": "invoice_no",
    "invoicenumber": "invoice_no",
    "billnumber": "invoice_no",
    "invoice_no": "invoice_no",
    "vendor": "vendor",
    "vendor name": "vendor",
    "vendorname": "vendor",
    "vendor_name": "vendor",
    "gstin": "gstin",
    "gst": "gstin",
    "vendor gstin": "gstin",
    "vendor_gstin": "gstin",
    "taxable": "taxable_amount",
    "taxable amount": "taxable_amount",
    "taxableamount": "taxable_amount",
    "taxable_amount": "taxable_amount",
    "tax": "tax_amount",
    "tax amount": "tax_amount",
    "taxamount": "tax_amount",
    "tax_amount": "tax_amount",
    "total": "total_amount",
    "grand total": "total_amount",
    "total amount": "total_amount",
    "amount": "total_amount",
    "totalamount": "total_amount",
    "total_amount": "total_amount",
    "invoice date": "invoice_date",
    "invoicedate": "invoice_date",
    "invoice_date": "invoice_date",
    "date": "invoice_date",
}

LEDGER_FIELDS = ["invoice_no", "vendor", "gstin", "taxable_amount", "tax_amount", "total_amount", "invoice_date"]


def map_ledger_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Map raw column names to standard ledger fields."""
    rename = {}
    for col in df.columns:
        key = str(col).strip().lower()
        if key in LEDGER_COLUMN_MAP:
            rename[col] = LEDGER_COLUMN_MAP[key]
    df = df.rename(columns=rename)
    return df
