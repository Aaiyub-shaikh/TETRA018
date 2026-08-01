// ─── Types matching FastAPI responses ────────────────────────────────────────

export interface InvoiceFlag {
  check: string;
  severity: 'Low' | 'Medium' | 'High';
  detail: string;
}

export interface InvoiceFields {
  invoice_number: string | null;
  date: string;
  vendor_gstin: string | null;
  customer_gstin: string | null;
  all_gstins: string[];
  vendor_name: string;
  taxable_amount: number;
  tax_amount: number;
  total_amount: number;
  place_of_supply: string;
}

export interface InvoiceRisk {
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  confidence: number;
  flags: InvoiceFlag[];
  flag_count: number;
}

export interface UploadResponse {
  success: boolean;
  filename: string;
  file_size_kb: number;
  extraction_method: string;
  page_count: number;
  raw_text_preview: string;
  fields: InvoiceFields;
  risk: InvoiceRisk;
}

// Invoice record as stored in MongoDB invoices collection
export interface InvoiceRecord {
  invoice_number: string | null;
  vendor: string;
  vendor_gstin: string | null;
  invoice_date: string;
  tax_amount: number;
  total_amount: number;
  total: number;
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High';
  confidence: number;
  status: string;
  filename: string;
  upload_time: string;
  created_at: string;
  flag_count: number;
  exceptions?: InvoiceFlag[];
}

// Vendor record from vendor_master
export interface VendorRecord {
  vendorNo?: string;
  vendorName: string;
  gstin: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  status: string;
  created_at?: string;
}

// Ledger record from purchase_ledger
export interface LedgerRecord {
  invoiceNumber: string;
  vendorName: string;
  vendorNo?: string;
  gstin?: string;
  invoiceDate: string;
  amount: number;
  taxAmount?: number;
  status: string;
  created_at?: string;
}

// Dashboard stats
export interface DashboardStats {
  invoices_processed: number;
  risks_detected: number;
  pending_review: number;
  duplicate_invoices: number;
  gst_errors: number;
  ledger_mismatches: number;
}

// Audit event
export interface AuditEvent {
  filename?: string;
  timestamp: string;
  risk?: { risk_score: number; risk_level: string; confidence: number };
  exceptions?: InvoiceFlag[];
  processing_time?: number;
}

// Add vendor payload
export interface AddVendorPayload {
  vendorName: string;
  gstin: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  status?: string;
}

// Add ledger payload
export interface AddLedgerPayload {
  invoiceNumber: string;
  vendorName: string;
  gstin?: string;
  invoiceDate?: string;
  amount: number;
  taxAmount?: number;
  status?: string;
}

// ─── Base URL ─────────────────────────────────────────────────────────────────

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      if (err?.detail) message = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
    } catch { /* ignore */ }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadInvoice(
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error('Invalid JSON from server.')); }
      } else {
        let msg = `Server error (${xhr.status})`;
        try { const e = JSON.parse(xhr.responseText); if (e?.detail) msg = e.detail; } catch { /* ignore */ }
        reject(new Error(msg));
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Network error — backend unreachable.')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted.')));
    xhr.open('POST', `${BASE_URL}/api/upload`);
    xhr.send(formData);
  });
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export async function fetchInvoices(): Promise<{ invoices: InvoiceRecord[]; total: number }> {
  return apiFetch('/api/invoices');
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

export async function fetchVendors(): Promise<{ vendors: VendorRecord[]; total: number }> {
  return apiFetch('/api/vendors');
}

export async function addVendor(payload: AddVendorPayload): Promise<{ success: boolean; vendor: VendorRecord }> {
  return apiFetch('/api/vendors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Ledger ───────────────────────────────────────────────────────────────────

export async function fetchLedger(): Promise<{ entries: LedgerRecord[]; total: number }> {
  return apiFetch('/api/ledger');
}

export async function addLedger(payload: AddLedgerPayload): Promise<{ success: boolean; entry: LedgerRecord }> {
  return apiFetch('/api/ledger', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch('/api/dashboard/stats');
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export async function fetchAuditTrail(limit = 50): Promise<{ events: AuditEvent[]; total: number }> {
  return apiFetch(`/api/audit?limit=${limit}`);
}
