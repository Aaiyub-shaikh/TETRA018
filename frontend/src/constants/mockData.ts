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

export const mockVendors: Vendor[] = [
  {
    id: 'v1',
    name: 'Reliance Industries Ltd.',
    gstin: '27ABCDE1234F1Z5',
    invoiceCount: 42,
    averageAmount: 1250000,
    fraudScore: 8,
    riskLevel: 'Low',
    status: 'Active',
    riskHistory: [
      { date: 'Mar', score: 5 },
      { date: 'Apr', score: 6 },
      { date: 'May', score: 8 },
      { date: 'Jun', score: 8 },
      { date: 'Jul', score: 8 },
    ],
    invoices: [
      { id: 'i1', invoiceNo: 'INV-2026-00128', amount: 1540000, date: '2026-07-28', status: 'Verified' },
      { id: 'i6', invoiceNo: 'INV-2026-00134', amount: 960000, date: '2026-07-15', status: 'Verified' },
    ],
    address: 'Maker Chambers IV, Nariman Point, Mumbai, Maharashtra 400021',
    bankAccount: 'HDFC Bank - ••••••9821',
  },
  {
    id: 'v2',
    name: 'Tata Steel Ltd.',
    gstin: '24AAACI5950L1ZV',
    invoiceCount: 28,
    averageAmount: 840000,
    fraudScore: 14,
    riskLevel: 'Low',
    status: 'Active',
    riskHistory: [
      { date: 'Mar', score: 10 },
      { date: 'Apr', score: 12 },
      { date: 'May', score: 11 },
      { date: 'Jun', score: 15 },
      { date: 'Jul', score: 14 },
    ],
    invoices: [
      { id: 'i2', invoiceNo: 'INV-2026-00129', amount: 845000, date: '2026-07-25', status: 'GST Mismatch' },
    ],
    address: 'Bombay House, 24 Homi Mody Street, Fort, Mumbai 400001',
    bankAccount: 'State Bank of India - ••••••4512',
  },
  {
    id: 'v3',
    name: 'Infosys Ltd.',
    gstin: '29AABCT3518Q1ZX',
    invoiceCount: 15,
    averageAmount: 450000,
    fraudScore: 5,
    riskLevel: 'Low',
    status: 'Active',
    riskHistory: [
      { date: 'Mar', score: 5 },
      { date: 'Apr', score: 5 },
      { date: 'May', score: 5 },
      { date: 'Jun', score: 5 },
      { date: 'Jul', score: 5 },
    ],
    invoices: [
      { id: 'i3', invoiceNo: 'INV-2026-00130', amount: 450000, date: '2026-07-24', status: 'Verified' },
    ],
    address: 'Electronics City, Hosur Road, Bangalore, Karnataka 560100',
    bankAccount: 'ICICI Bank - ••••••7734',
  },
  {
    id: 'v4',
    name: 'Larsen & Toubro Ltd.',
    gstin: '27AAACL3190M1ZO',
    invoiceCount: 19,
    averageAmount: 2300000,
    fraudScore: 58,
    riskLevel: 'Medium',
    status: 'Under Investigation',
    riskHistory: [
      { date: 'Mar', score: 15 },
      { date: 'Apr', score: 20 },
      { date: 'May', score: 45 },
      { date: 'Jun', score: 52 },
      { date: 'Jul', score: 58 },
    ],
    invoices: [
      { id: 'i4', invoiceNo: 'INV-2026-00131', amount: 3200000, date: '2026-07-22', status: 'Duplicate' },
    ],
    address: 'L&T House, Ballard Estate, Mumbai, Maharashtra 400001',
    bankAccount: 'Axis Bank - ••••••0019',
    flaggedReasons: ['Multiple identical invoice submissions within 24h', 'OCR amount mismatch with ledger records'],
  },
  {
    id: 'v5',
    name: 'Adani Enterprises Ltd.',
    gstin: '24AAACA3418B2ZM',
    invoiceCount: 11,
    averageAmount: 3100000,
    fraudScore: 78,
    riskLevel: 'High',
    status: 'Flagged',
    riskHistory: [
      { date: 'Mar', score: 32 },
      { date: 'Apr', score: 40 },
      { date: 'May', score: 65 },
      { date: 'Jun', score: 72 },
      { date: 'Jul', score: 78 },
    ],
    invoices: [
      { id: 'i5', invoiceNo: 'INV-2026-00132', amount: 4800000, date: '2026-07-20', status: 'High Risk' },
    ],
    address: 'Adani Corporate House, Shantigram, SG Highway, Ahmedabad 382421',
    bankAccount: 'Punjab National Bank - ••••••2289',
    flaggedReasons: ['GSTIN registration flagged as inactive on GST Portal', 'Abrupt spike in invoice frequency'],
  },
  {
    id: 'v6',
    name: 'Mahindra Logistics Ltd.',
    gstin: '27AAACM4815F1ZE',
    invoiceCount: 33,
    averageAmount: 280000,
    fraudScore: 22,
    riskLevel: 'Low',
    status: 'Active',
    riskHistory: [
      { date: 'Mar', score: 18 },
      { date: 'Apr', score: 20 },
      { date: 'May', score: 22 },
      { date: 'Jun', score: 22 },
      { date: 'Jul', score: 22 },
    ],
    invoices: [
      { id: 'i7', invoiceNo: 'INV-2026-00135', amount: 280000, date: '2026-07-12', status: 'Ledger Missing' },
    ],
    address: 'Mahindra Towers, P.K. Kurne Chowk, Worli, Mumbai 400018',
    bankAccount: 'Kotak Mahindra Bank - ••••••1192',
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'i1',
    invoiceNo: 'INV-2026-00128',
    vendorId: 'v1',
    vendorName: 'Reliance Industries Ltd.',
    vendorGstin: '27ABCDE1234F1Z5',
    date: '2026-07-28',
    dueDate: '2026-08-28',
    amount: 1540000,
    taxAmount: 277200,
    status: 'Verified',
    confidence: 98.4,
    riskScore: 4,
    aiExplanation: 'The invoice checks out completely. OCR confidence is exceptionally high, GSTIN matches public database, ledger record exists, and bank details match the corporate vendor master file.',
    detectedAnomalies: [],
    extractedFields: {
      invoiceNo: 'INV-2026-00128',
      date: '28-07-2026',
      gstin: '27ABCDE1234F1Z5',
      amount: '₹15,40,000.00',
      bankDetails: 'HDFC Bank A/C 9876543210',
    },
  },
  {
    id: 'i2',
    invoiceNo: 'INV-2026-00129',
    vendorId: 'v2',
    vendorName: 'Tata Steel Ltd.',
    vendorGstin: '24AAACI5950L1ZV',
    date: '2026-07-25',
    dueDate: '2026-08-25',
    amount: 845000,
    taxAmount: 152100,
    status: 'GST Mismatch',
    confidence: 94.1,
    riskScore: 45,
    aiExplanation: 'The GSTIN extracted from the document ("24AAACI5950L1ZV") does not match the vendor GSTIN declared in our internal database ("24AAACI5950L1ZX"). Additionally, the IGST rate applied on the invoice (18%) differs from the standard HSN code rate of 12% for this category of steel.',
    detectedAnomalies: [
      { field: 'GSTIN', issue: 'Document GSTIN does not match database records', severity: 'High' },
      { field: 'Tax Rate', issue: 'Tax rate (18%) deviates from HSN standard rate (12%)', severity: 'Medium' },
    ],
    extractedFields: {
      invoiceNo: 'INV-2026-00129',
      date: '25-07-2026',
      gstin: '24AAACI5950L1ZV',
      amount: '₹8,45,000.00',
      bankDetails: 'SBI A/C 1122334455',
    },
  },
  {
    id: 'i3',
    invoiceNo: 'INV-2026-00130',
    vendorId: 'v3',
    vendorName: 'Infosys Ltd.',
    vendorGstin: '29AABCT3518Q1ZX',
    date: '2026-07-24',
    dueDate: '2026-08-24',
    amount: 450000,
    taxAmount: 81000,
    status: 'Verified',
    confidence: 99.2,
    riskScore: 2,
    aiExplanation: 'All checks passed. Signature is verified, bank details are correct, and invoice fits within historical pricing boundaries for this vendor.',
    detectedAnomalies: [],
    extractedFields: {
      invoiceNo: 'INV-2026-00130',
      date: '24-07-2026',
      gstin: '29AABCT3518Q1ZX',
      amount: '₹4,50,000.00',
      bankDetails: 'ICICI Bank A/C 9988776655',
    },
  },
  {
    id: 'i4',
    invoiceNo: 'INV-2026-00131',
    vendorId: 'v4',
    vendorName: 'Larsen & Toubro Ltd.',
    vendorGstin: '27AAACL3190M1ZO',
    date: '2026-07-22',
    dueDate: '2026-08-22',
    amount: 3200000,
    taxAmount: 576000,
    status: 'Duplicate',
    confidence: 96.8,
    riskScore: 88,
    aiExplanation: 'Flagged as potential duplicate. An invoice with the exact same invoice amount (₹32,00,000.00), vendor (Larsen & Toubro Ltd.), and bill date was processed 24 hours prior under invoice number "INV-2026-00125". The layout and signature placement are 99% identical.',
    detectedAnomalies: [
      { field: 'Invoice Content', issue: 'Duplicate metadata and item lines found in INV-2026-00125', severity: 'High' },
      { field: 'Invoice No', issue: 'Sequential invoice collision detected', severity: 'Low' },
    ],
    extractedFields: {
      invoiceNo: 'INV-2026-00131',
      date: '22-07-2026',
      gstin: '27AAACL3190M1ZO',
      amount: '₹32,00,000.00',
      bankDetails: 'Axis Bank A/C 4455667788',
    },
  },
  {
    id: 'i5',
    invoiceNo: 'INV-2026-00132',
    vendorId: 'v5',
    vendorName: 'Adani Enterprises Ltd.',
    vendorGstin: '24AAACA3418B2ZM',
    date: '2026-07-20',
    dueDate: '2026-08-20',
    amount: 4800000,
    taxAmount: 864000,
    status: 'High Risk',
    confidence: 89.5,
    riskScore: 92,
    aiExplanation: 'Critical risk detected. The bank account listed on the invoice (PNB A/C 5544332211) does not match the approved vendor bank details in our ERP system (PNB A/C 9988776655). This is a high-probability vector for payment redirect fraud. In addition, the GSTIN registration has been flagged as inactive on the government portal since May 2026.',
    detectedAnomalies: [
      { field: 'Bank Account', issue: 'Mismatched bank details; potential payment redirection fraud', severity: 'High' },
      { field: 'GSTIN Status', issue: 'GSTIN is marked as INACTIVE on government database', severity: 'High' },
      { field: 'Amount Spike', issue: 'Invoice amount is 2.5x higher than vendor average', severity: 'Medium' },
    ],
    extractedFields: {
      invoiceNo: 'INV-2026-00132',
      date: '20-07-2026',
      gstin: '24AAACA3418B2ZM',
      amount: '₹48,00,000.00',
      bankDetails: 'PNB A/C 5544332211',
    },
  },
  {
    id: 'i7',
    invoiceNo: 'INV-2026-00135',
    vendorId: 'v6',
    vendorName: 'Mahindra Logistics Ltd.',
    vendorGstin: '27AAACM4815F1ZE',
    date: '2026-07-12',
    dueDate: '2026-08-12',
    amount: 280000,
    taxAmount: 50400,
    status: 'Ledger Missing',
    confidence: 97.5,
    riskScore: 50,
    aiExplanation: 'The invoice was extracted successfully, but no corresponding purchase order (PO) or goods received note (GRN) matches this amount and date in our corporate ledger. The invoice has been flagged to verify if services were actually rendered.',
    detectedAnomalies: [
      { field: 'Ledger matching', issue: 'No matching PO or GRN record found in the ERP', severity: 'High' },
    ],
    extractedFields: {
      invoiceNo: 'INV-2026-00135',
      date: '12-07-2026',
      gstin: '27AAACM4815F1ZE',
      amount: '₹2,80,000.00',
      bankDetails: 'Kotak Bank A/C 7766554433',
    },
  },
];

export const mockAuditTrail: AuditEvent[] = [
  {
    id: 'a1',
    timestamp: '2026-07-28 14:32:10',
    action: 'Invoice Analyzed',
    user: 'AI Engine',
    targetType: 'Invoice',
    targetId: 'i1',
    details: 'OCR extraction completed for INV-2026-00128. Confidence: 98.4%. Risk score evaluated as 4.',
    severity: 'Info',
  },
  {
    id: 'a2',
    timestamp: '2026-07-25 11:15:02',
    action: 'GST Flag Raised',
    user: 'AI Engine',
    targetType: 'Invoice',
    targetId: 'i2',
    details: 'GSTIN mismatch detected. Document has 24AAACI5950L1ZV, ERP master lists 24AAACI5950L1ZX.',
    severity: 'Warning',
  },
  {
    id: 'a3',
    timestamp: '2026-07-22 09:44:55',
    action: 'Duplicate Flag Raised',
    user: 'AI Engine',
    targetType: 'Invoice',
    targetId: 'i4',
    details: 'Invoice INV-2026-00131 flagged as duplicate of INV-2026-00125. Amount: 3,200,000.',
    severity: 'Critical',
  },
  {
    id: 'a4',
    timestamp: '2026-07-21 16:22:18',
    action: 'Invoice Overridden',
    user: 'admin@tetra.com',
    targetType: 'Invoice',
    targetId: 'i3',
    details: 'Manually verified INV-2026-00130, changing status from Pending Review to Verified.',
    severity: 'Info',
  },
  {
    id: 'a5',
    timestamp: '2026-07-20 18:05:40',
    action: 'Bank Mismatch Alert',
    user: 'AI Engine',
    targetType: 'Invoice',
    targetId: 'i5',
    details: 'Severe: Payment redirect fraud suspect. Bank details on INV-2026-00132 do not match Adani Enterprises master data.',
    severity: 'Critical',
  },
];

export const mockDashboardStats = {
  invoicesProcessed: { value: 138, change: '+12.5%', isPositive: true },
  risksDetected: { value: 14, change: '+4.2%', isPositive: false },
  pendingReview: { value: 8, change: '-15.4%', isPositive: true },
  duplicateInvoices: { value: 3, change: '0.0%', isPositive: true },
  gstErrors: { value: 4, change: '+25.0%', isPositive: false },
  ledgerMismatches: { value: 7, change: '-22.2%', isPositive: true },
};

export const mockRiskDistribution = [
  { name: 'GST Mismatch', value: 4 },
  { name: 'Duplicate Invoice', value: 3 },
  { name: 'Ledger Missing', value: 2 },
  { name: 'Payment Fraud (High Risk)', value: 5 },
];

export const mockMonthlyInvoices = [
  { name: 'Jan', processed: 95, flagged: 8 },
  { name: 'Feb', processed: 110, flagged: 12 },
  { name: 'Mar', processed: 125, flagged: 15 },
  { name: 'Apr', processed: 120, flagged: 10 },
  { name: 'May', processed: 130, flagged: 18 },
  { name: 'Jun', processed: 142, flagged: 16 },
  { name: 'Jul', processed: 138, flagged: 14 },
];
