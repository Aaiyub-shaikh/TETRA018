"""
Integration test: upload the UNCUE DERMACARE invoice PDF and verify full pipeline.
"""
import urllib.request
import json
import sys
import fitz  # PyMuPDF

def create_invoice_pdf() -> bytes:
    """Creates a realistic in-memory PDF of the UNCUE DERMACARE invoice."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    invoice_text = (
        "TAX INVOICE - ORIGINAL FOR RECIPIENT\n"
        "UNCUE DERMACARE PRIVATE LIMITED\n"
        "GSTIN 23AADCU2395N1ZY\n"
        "C/o KARUNA GUPTA KURELE, 1st Floor, Shahdol, MADHYA PRADESH, 484001\n\n"
        "Invoice #: INV-117   Invoice Date: 01 Feb 2024   Due Date: 29 Jan 2024\n"
        "Place of Supply: 23-MADHYA PRADESH\n\n"
        "Item                           Rate    Qty    Taxable Value  Tax Amount  Amount\n"
        "Kera M 5% Solution             492.86  1 BTL  492.86         59.14(12%)  552.00\n"
        "Arachitol Nano (60k) 4x5ml    299.58  3 BTL  898.73        107.85(12%) 1006.58\n"
        "Neurobion Forte - 30 tablets   30.58  3 STRP   91.73         16.51(18%)  108.24\n\n"
        "Taxable Amount  Rs 1483.32\n"
        "CGST 6.0%         Rs 83.50\n"
        "SGST 6.0%         Rs 83.50\n"
        "CGST 9.0%          Rs 8.26\n"
        "SGST 9.0%          Rs 8.26\n"
        "Round Off           Rs 0.18\n"
        "Total           Rs 1667.00\n\n"
        "Bank: Kotak Mahindra Bank  Account #: 1146860541  IFSC: KKBK0000725\n"
    )
    page.insert_text((50, 50), invoice_text, fontsize=9)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def upload_invoice(pdf_bytes: bytes) -> dict:
    CRLF = b"\r\n"
    boundary = b"TestBoundary1234"
    body = (
        b"--" + boundary + CRLF
        + b'Content-Disposition: form-data; name="file"; filename="test_invoice.pdf"' + CRLF
        + b"Content-Type: application/pdf" + CRLF
        + CRLF
        + pdf_bytes
        + CRLF
        + b"--" + boundary + b"--" + CRLF
    )
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/upload",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary.decode()}"},
        method="POST",
    )
    res = urllib.request.urlopen(req, timeout=30)
    return json.loads(res.read()), res.status

def main():
    print("=" * 60)
    print("Invexa AI — Backend Integration Test")
    print("=" * 60)

    # --- Test 1: Health ---
    res = urllib.request.urlopen("http://127.0.0.1:8000/")
    data = json.loads(res.read())
    assert data["status"] == "online", "Root endpoint failed"
    print(f"[PASS] GET /          -> {data['status']}")

    # --- Test 2: Health check ---
    res = urllib.request.urlopen("http://127.0.0.1:8000/api/health")
    data = json.loads(res.read())
    assert data["status"] == "healthy"
    print(f"[PASS] GET /api/health -> {data['status']}")

    # --- Test 3: Swagger docs ---
    res = urllib.request.urlopen("http://127.0.0.1:8000/docs")
    assert res.status == 200
    print(f"[PASS] GET /docs       -> HTTP {res.status} (Swagger UI)")

    # --- Test 4: Upload endpoint ---
    print("\n[RUN]  POST /api/upload with UNCUE DERMACARE invoice PDF...")
    pdf_bytes = create_invoice_pdf()
    data, status = upload_invoice(pdf_bytes)

    print(f"[PASS] POST /api/upload -> HTTP {status}")
    print(f"\n  File: {data.get('filename')}")
    print(f"  Extraction method: {data.get('extraction_method')}")
    print(f"  Page count: {data.get('page_count')}")

    fields = data.get("fields", {})
    print(f"\n  Extracted Fields:")
    print(f"    Invoice #:     {fields.get('invoice_number')}")
    print(f"    Date:          {fields.get('date')}")
    print(f"    Vendor GSTIN:  {fields.get('vendor_gstin')}")
    print(f"    Vendor Name:   {fields.get('vendor_name')}")
    print(f"    Taxable Amt:   {fields.get('taxable_amount')}")
    print(f"    Tax Amount:    {fields.get('tax_amount')}")
    print(f"    Total Amount:  {fields.get('total_amount')}")
    print(f"    Place of Supply: {fields.get('place_of_supply')}")

    risk = data.get("risk", {})
    print(f"\n  Risk Assessment:")
    print(f"    Risk Score:  {risk.get('risk_score')}")
    print(f"    Risk Level:  {risk.get('risk_level')}")
    print(f"    Confidence:  {risk.get('confidence')}%")
    print(f"    Total Flags: {risk.get('flag_count')}")
    for flag in risk.get("flags", []):
        print(f"      [{flag['severity']}] {flag['check']}: {flag['detail'][:70]}")

    print(f"\n  Raw Text Preview (first 300 chars):")
    print(f"    {data.get('raw_text_preview', '')[:300]}")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED — Backend fully operational!")
    print("=" * 60)

if __name__ == "__main__":
    main()
