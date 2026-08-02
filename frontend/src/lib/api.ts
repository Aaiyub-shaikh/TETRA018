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

export async function fetchInvoices(filters?: { search?: string; status?: string; risk?: string; vendor?: string; date?: string; page?: number }): Promise<{ invoices: InvoiceRecord[]; total: number; page: number; page_size: number; total_pages: number }> {
  let url = '/api/invoices';
  const params: string[] = [];
  if (filters) {
    if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.status) params.push(`status=${encodeURIComponent(filters.status)}`);
    if (filters.risk) params.push(`risk=${encodeURIComponent(filters.risk)}`);
    if (filters.vendor) params.push(`vendor=${encodeURIComponent(filters.vendor)}`);
    if (filters.date) params.push(`date=${encodeURIComponent(filters.date)}`);
    if (filters.page) params.push(`page=${encodeURIComponent(String(filters.page))}`);
  }
  if (params.length > 0) {
    url += '?' + params.join('&');
  }
  return apiFetch(url);
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

export async function fetchVendors(page?: number, search?: string, status?: string): Promise<{ vendors: VendorRecord[]; total: number; page: number; page_size: number; total_pages: number }> {
  const p: string[] = [];
  if (page) p.push(`page=${page}`);
  if (search) p.push(`search=${encodeURIComponent(search)}`);
  if (status && status !== 'ALL') p.push(`status=${encodeURIComponent(status)}`);
  const qs = p.length ? `?${p.join('&')}` : '';
  return apiFetch(`/api/vendors${qs}`);
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

export async function fetchLedger(page?: number): Promise<{ entries: LedgerRecord[]; total: number; page: number; page_size: number; total_pages: number }> {
  let url = '/api/ledger';
  if (page) {
    url += `?page=${encodeURIComponent(String(page))}`;
  }
  return apiFetch(url);
}

export async function addLedger(payload: AddLedgerPayload): Promise<{ success: boolean; entry: LedgerRecord }> {
  return apiFetch('/api/ledger', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function importVendors(file: File): Promise<{ success: boolean; rows_imported: number; duplicates_skipped: number; errors: number }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/api/vendors/import`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Import failed' }));
    throw new Error(err.detail || 'Import failed');
  }
  return res.json();
}

export async function importLedger(file: File): Promise<{ success: boolean; rows_imported: number; duplicates_skipped: number; errors: number }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/api/ledger/import`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Import failed' }));
    throw new Error(err.detail || 'Import failed');
  }
  return res.json();
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

// ─── Audit Trail ──────────────────────────────────────────────────────────────

export interface AuditTrailEvent {
  _id: string;
  invoice_id?: string;
  invoice_number: string;
  event_type: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  module: string;
  performed_by: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export async function fetchAuditTrailEvents(params: {
  search?: string;
  severity?: string;
  status?: string;
  event_type?: string;
  module?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}): Promise<{ events: AuditTrailEvent[]; total: number }> {
  let url = '/api/audit-trail?';
  const p: string[] = [];
  if (params.search) p.push(`search=${encodeURIComponent(params.search)}`);
  if (params.severity) p.push(`severity=${encodeURIComponent(params.severity)}`);
  if (params.status) p.push(`status=${encodeURIComponent(params.status)}`);
  if (params.event_type) p.push(`event_type=${encodeURIComponent(params.event_type)}`);
  if (params.module) p.push(`module=${encodeURIComponent(params.module)}`);
  if (params.date_from) p.push(`date_from=${encodeURIComponent(params.date_from)}`);
  if (params.date_to) p.push(`date_to=${encodeURIComponent(params.date_to)}`);
  if (params.limit) p.push(`limit=${params.limit}`);
  if (params.offset) p.push(`offset=${params.offset}`);
  url += p.join('&');
  return apiFetch(url);
}

export async function fetchRecentAuditEvents(): Promise<{ events: AuditTrailEvent[]; total: number }> {
  return apiFetch('/api/audit-trail/recent');
}

export async function fetchInvoiceAuditTrail(invoiceId: string): Promise<{ events: AuditTrailEvent[]; total: number }> {
  return apiFetch(`/api/audit-trail/${encodeURIComponent(invoiceId)}`);
}

// ─── AI Chat ─────────────────────────────────────────────────────────────

export async function chatAboutInvoice(invoiceId: string, question: string): Promise<{ answer: string; invoice_id: string }> {
  return apiFetch('/api/chat/invoice', {
    method: 'POST',
    body: JSON.stringify({ invoice_id: invoiceId, question }),
  });
}

// ─── Profile ─────────────────────────────────────────────────────────────

export interface ProfileData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone: string;
  department: string;
  designation: string;
  organization: string;
  employee_id: string;
  profile_image: string;
  joined_at: string;
  last_login: string;
  account_status: string;
  stats: {
    total_invoices_scanned: number;
    high_risk_reviewed: number;
    reports_generated: number;
    emails_sent: number;
    last_activity: string;
  };
  recent_invoices: any[];
  recent_activity: any[];
  recent_emails: any[];
}

export async function fetchProfile(): Promise<ProfileData> {
  return apiFetch('/api/profile');
}

export async function updateProfile(payload: {
  full_name?: string;
  phone?: string;
  department?: string;
  designation?: string;
  organization?: string;
}): Promise<{ success: boolean; message: string }> {
  return apiFetch('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function uploadProfilePhoto(file: File): Promise<{ success: boolean; profile_image: string }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const formData = new FormData();
  formData.append('file', file);
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/api/profile/photo`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function changePassword(payload: {
  current_password: string;
  new_password: string;
}): Promise<{ success: boolean; message: string }> {
  return apiFetch('/api/profile/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ─── Settings ────────────────────────────────────────────────────────────

export interface AppSettings {
  _id?: string;
  organization: string;
  currency: string;
  timezone: string;
  date_format: string;
  language: string;
  ai: {
    enabled: boolean;
    model: string;
    temperature: number;
    max_tokens: number;
    prompt_style: string;
  };
  ocr: {
    engine: string;
    language: string;
    confidence: number;
    image_enhancement: boolean;
    auto_rotation: boolean;
  };
  risk: {
    threshold: number;
    duplicate_detection: boolean;
    gst_validation: boolean;
    vendor_validation: boolean;
    ledger_matching: boolean;
  };
  email: {
    smtp_server: string;
    smtp_port: number;
    sender_email: string;
    reply_email: string;
    notifications_enabled: boolean;
    auto_send_report: boolean;
  };
  notifications: {
    browser_notifications: boolean;
    email_alerts: boolean;
    invoice_completion: boolean;
    risk_alerts: boolean;
  };
  security: {
    session_timeout: number;
    two_factor_enabled: boolean;
  };
  [key: string]: any;
}

export async function fetchSettings(): Promise<AppSettings> {
  return apiFetch('/api/settings');
}

export async function updateSettings(payload: Partial<AppSettings>): Promise<{ success: boolean; message: string }> {
  return apiFetch('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
