// ─── Types matching actual MongoDB collection schemas ────────────────────────

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
  summary?: string;
  ai_explanation?: string;
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
  risk_summary?: string;
  gemini_analysis?: string;
  recommendations?: string;
  ai_summary?: string;
  ai_explanation?: string;
  risk_explanations?: RiskExplanation[];
}

export interface InvoiceDetailResponse {
  invoice: InvoiceRecord;
  risk: {
    risk_score: number;
    risk_level: 'Low' | 'Medium' | 'High';
    confidence: number;
  };
  exceptions: InvoiceFlag[];
  gemini_analysis?: string;
  recommendations?: string;
  risk_summary?: string;
  risk_explanations?: RiskExplanation[];
}

export interface RiskExplanation {
  type: string;
  severity: 'Low' | 'Medium' | 'High';
  reason: string;
  impact: string;
  recommendation: string;
  evidence?: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

// Invoice record as stored in MongoDB invoices collection
// DB uses camelCase: invoiceNumber, vendorName, gstin, invoiceDate, taxableValue, taxAmount, totalAmount, fileName
export interface InvoiceRecord {
  _id?: string;
  invoiceNo?: string;        // purchase_ledger uses invoiceNo
  invoiceNumber?: string;
  invoice_number?: string;
  vendorName?: string;
  vendor?: string;
  gstin?: string;
  vendor_gstin?: string;
  invoiceDate?: string;
  invoice_date?: string;
  taxableValue?: number;
  taxable_amount?: number;
  invoiceSum?: number;       // purchase_ledger uses invoiceSum for total
  taxAmount?: number;
  tax_amount?: number;
  totalAmount?: number;
  total_amount?: number;
  total?: number;
  fileName?: string;
  filename?: string;
  status?: string;
  riskLevel?: string;
  risk_level?: string;
  riskScore?: number;
  risk_score?: number;
  confidence?: number;
  flagCount?: number;
  flag_count?: number;
  flags?: InvoiceFlag[];
  exceptions?: InvoiceFlag[];
  upload_time?: string;
  uploadTime?: string;
  created_at?: string;
  rawText?: string;
  raw_text?: string;
  [key: string]: any;        // allow extra fields from MongoDB
}

// Vendor record from vendor_master
// DB uses: vendor (not vendorName), gstin, email, phone, address
export interface VendorRecord {
  vendor: string;
  gstin: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  [key: string]: any;
}

// Ledger record from purchase_ledger
// DB uses: invoiceNo, vendor, gstin, invoiceDate, invoiceSum, taxAmount
export interface LedgerRecord {
  invoiceNo: string;
  vendor: string;
  gstin?: string;
  invoiceDate?: string;
  invoiceSum: number;
  taxAmount?: number;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  [key: string]: any;
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

// Add vendor payload (matches DB schema: vendor, gstin, email, phone, address)
export interface AddVendorPayload {
  vendor: string;
  gstin: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Add ledger payload (matches DB schema: invoiceNo, vendor, gstin, invoiceDate, invoiceSum, taxAmount)
export interface AddLedgerPayload {
  invoiceNo: string;
  vendor: string;
  gstin?: string;
  invoiceDate?: string;
  invoiceSum: number;
  taxAmount?: number;
}

// ─── Base URL ─────────────────────────────────────────────────────────────────

export const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

// ─── Helpers ─────────────────────────────────────────────────────────────────

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { ...headers, ...options?.headers },
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

// ─── Helper: normalize invoice record field access ────────────────────────────

export function inv_invoiceNumber(inv: InvoiceRecord): string {
  return inv.invoiceNumber || inv.invoice_number || inv.invoiceNo || '—';
}
export function inv_vendor(inv: InvoiceRecord): string {
  return inv.vendorName || inv.vendor || '—';
}
export function inv_gstin(inv: InvoiceRecord): string {
  return inv.gstin || inv.vendor_gstin || '—';
}
export function inv_date(inv: InvoiceRecord): string {
  return inv.invoiceDate || inv.invoice_date || '';
}
export function inv_taxAmount(inv: InvoiceRecord): number {
  return inv.taxAmount ?? inv.tax_amount ?? 0;
}
export function inv_totalAmount(inv: InvoiceRecord): number {
  return inv.totalAmount ?? inv.total_amount ?? inv.invoiceSum ?? inv.total ?? 0;
}
export function inv_riskScore(inv: InvoiceRecord): number {
  if (inv.riskScore != null) return inv.riskScore;
  if (inv.risk_score != null) return inv.risk_score;
  const rl = inv.riskLevel || inv.risk_level || '';
  return rl === 'High' ? 85 : rl === 'Medium' ? 45 : 10;
}
export function inv_confidence(inv: InvoiceRecord): number | null {
  return inv.confidence ?? null;
}
export function inv_riskLevel(inv: InvoiceRecord): string {
  return inv.riskLevel || inv.risk_level || 'Low';
}
export function inv_uploadTime(inv: InvoiceRecord): string {
  return inv.upload_time || inv.uploadTime || inv.created_at || '';
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  });
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export async function fetchInvoices(filters?: { search?: string; status?: string; risk?: string; vendor?: string; date?: string }): Promise<{ invoices: InvoiceRecord[]; total: number }> {
  let url = '/api/invoices';
  const params: string[] = [];
  if (filters) {
    if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.status) params.push(`status=${encodeURIComponent(filters.status)}`);
    if (filters.risk) params.push(`risk=${encodeURIComponent(filters.risk)}`);
    if (filters.vendor) params.push(`vendor=${encodeURIComponent(filters.vendor)}`);
    if (filters.date) params.push(`date=${encodeURIComponent(filters.date)}`);
  }
  if (params.length > 0) {
    url += '?' + params.join('&');
  }
  return apiFetch(url);
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

export async function fetchVendors(): Promise<{ vendors: VendorRecord[]; total: number }> {
  return apiFetch('/api/vendors');
}

export async function sendInvoiceReport(invoiceId: string, email: string): Promise<{ success: boolean; message: string }> {
  return apiFetch('/api/email/send-report', {
    method: 'POST',
    body: JSON.stringify({ invoice_id: invoiceId, email }),
  });
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

export async function fetchDashboardSummary(): Promise<any> {
  return apiFetch('/api/dashboard/summary');
}

export async function fetchDashboardMonthlyTrend(): Promise<any[]> {
  return apiFetch('/api/dashboard/monthly-trend');
}

export async function fetchDashboardAnomalies(): Promise<any[]> {
  return apiFetch('/api/dashboard/anomalies');
}

export async function fetchDashboardFlagged(): Promise<InvoiceRecord[]> {
  return apiFetch('/api/dashboard/flagged');
}

export async function fetchDashboardActivity(): Promise<any[]> {
  return apiFetch('/api/dashboard/activity');
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export async function fetchAuditTrail(limit = 50, search?: string, severity?: string): Promise<{ events: AuditEvent[]; total: number }> {
  let url = `/api/audit?limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (severity) url += `&severity=${encodeURIComponent(severity)}`;
  return apiFetch(url);
}

// ─── AI Chat ─────────────────────────────────────────────────────────────

export async function chatAboutInvoice(invoiceId: string, question: string): Promise<{ answer: string; invoice_id: string }> {
  return apiFetch('/api/chat/invoice', {
    method: 'POST',
    body: JSON.stringify({ invoice_id: invoiceId, question }),
  });
}
