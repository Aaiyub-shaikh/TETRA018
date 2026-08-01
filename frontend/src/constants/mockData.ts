export interface Vendor {
  id: string;
  name: string;
  gstin: string;
  invoiceCount: number;
  averageAmount: number;
  fraudScore: number; // 0 to 100
  riskLevel: 'Low' | 'Medium' | 'High';
  status: 'Active' | 'Under Investigation' | 'Flagged';
  riskHistory: { date: string; score: number }[];
  invoices: { id: string; invoiceNo: string; amount: number; date: string; status: string }[];
  address: string;
  bankAccount: string;
  flaggedReasons?: string[];
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  vendorId: string;
  vendorName: string;
  vendorGstin: string;
  date: string;
  dueDate: string;
  amount: number;
  taxAmount: number;
  status: 'Verified' | 'High Risk' | 'Pending Review' | 'Duplicate' | 'GST Mismatch' | 'Ledger Missing';
  confidence: number; // 0 to 100 (OCR extraction confidence)
  riskScore: number; // 0 to 100
  aiExplanation?: string;
  detectedAnomalies?: { field: string; issue: string; severity: 'Low' | 'Medium' | 'High' }[];
  extractedFields?: {
    invoiceNo: string;
    date: string;
    gstin: string;
    amount: string;
    bankDetails: string;
  };
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  targetType: 'Invoice' | 'Vendor' | 'System' | 'Settings';
  targetId: string;
  details: string;
  severity: 'Info' | 'Warning' | 'Critical';
}

export const mockVendors: Vendor[] = [];
export const mockInvoices: Invoice[] = [];
export const mockAuditTrail: AuditEvent[] = [];

export const mockDashboardStats = {
  invoicesProcessed: { value: 0, change: '0%', isPositive: true },
  risksDetected: { value: 0, change: '0%', isPositive: false },
  pendingReview: { value: 0, change: '0%', isPositive: true },
  duplicateInvoices: { value: 0, change: '0%', isPositive: true },
  gstErrors: { value: 0, change: '0%', isPositive: false },
  ledgerMismatches: { value: 0, change: '0%', isPositive: true },
};

export const mockRiskDistribution: { name: string; value: number }[] = [];
export const mockMonthlyInvoices: { name: string; processed: number; flagged: number }[] = [];
