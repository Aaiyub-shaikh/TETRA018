'use client';

import React, { useState, useEffect } from 'react';
import MonthlyInvoiceChart from '@/components/charts/MonthlyInvoiceChart';
import RiskChart from '@/components/charts/RiskChart';
import VendorChart from '@/components/charts/VendorChart';
import RiskBadge from '@/components/common/RiskBadge';
import Loader from '@/components/common/Loader';
import { 
  Download, 
  FileSpreadsheet, 
  Sparkles, 
  BarChart3, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  Filter, 
  Building2, 
  FileText, 
  ShieldAlert, 
  Receipt,
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { 
  fetchDashboardSummary, 
  fetchInvoices, 
  fetchVendors, 
  fetchLedger,
  InvoiceRecord,
  VendorRecord,
  LedgerRecord,
  inv_invoiceNumber,
  inv_vendor,
  inv_gstin,
  inv_date,
  inv_totalAmount,
  inv_taxAmount,
  inv_riskScore,
  inv_riskLevel
} from '@/lib/api';

export default function ReportsPage() {
  // Navigation & UI tabs
  const [activeTab, setActiveTab] = useState<'analytics' | 'invoices' | 'vendors' | 'ledger' | 'reports_list'>('analytics');
  
  // Data loading states
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Load all telemetry datasets
  const loadReportsData = async () => {
    try {
      const [sumRes, invRes, venRes, ledRes] = await Promise.all([
        fetchDashboardSummary().catch(() => null),
        fetchInvoices().catch(() => ({ invoices: [], total: 0 })),
        fetchVendors().catch(() => ({ vendors: [], total: 0 })),
        fetchLedger().catch(() => ({ entries: [], total: 0 }))
      ]);

      setSummary(sumRes);
      setInvoices(invRes?.invoices || []);
      setVendors(venRes?.vendors || []);
      setLedgerEntries(ledRes?.entries || []);
    } catch (err) {
      console.error('Error fetching reports page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadReportsData();
  }, []);

  // Live aggregated KPIs
  const totalInvoicesVal = invoices.reduce((acc, curr) => acc + inv_totalAmount(curr), 0);
  const totalTaxVal = invoices.reduce((acc, curr) => acc + inv_taxAmount(curr), 0);
  
  const verifiedCount = invoices.filter(i => i.status === 'Verified' || inv_riskLevel(i) === 'Low').length;
  const reconciliationRate = invoices.length > 0 
    ? ((verifiedCount / invoices.length) * 100).toFixed(1) 
    : '0.0';

  const gstValidCount = invoices.filter(i => i.gst_validation !== false && i.status !== 'GST Mismatch').length;
  const gstValidationRate = invoices.length > 0 
    ? ((gstValidCount / invoices.length) * 100).toFixed(1) 
    : '0.0';

  const duplicateCount = summary?.duplicates || invoices.filter(i => i.status === 'Duplicate').length;
  const ledgerMissesCount = summary?.ledger_misses || invoices.filter(i => i.status === 'Ledger Missing').length;
  const gstErrorsCount = summary?.gst_errors || invoices.filter(i => i.status === 'GST Mismatch').length;

  // Filtered lists
  const filteredInvoices = invoices.filter(inv => {
    const invNo = inv_invoiceNumber(inv).toLowerCase();
    const vendor = inv_vendor(inv).toLowerCase();
    const gstin = inv_gstin(inv).toLowerCase();
    const searchMatch = invNo.includes(searchTerm.toLowerCase()) || 
                        vendor.includes(searchTerm.toLowerCase()) || 
                        gstin.includes(searchTerm.toLowerCase());
                        
    const level = inv_riskLevel(inv);
    const riskMatch = riskFilter === 'ALL' || level.toUpperCase() === riskFilter.toUpperCase();
    
    const status = inv.status || 'Pending Review';
    const statusMatch = statusFilter === 'ALL' || status.toUpperCase() === statusFilter.toUpperCase();
    
    return searchMatch && riskMatch && statusMatch;
  });

  const filteredVendors = vendors.filter(v => {
    const name = (v.vendor || '').toLowerCase();
    const gstin = (v.gstin || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || gstin.includes(searchTerm.toLowerCase());
  });

  const filteredLedger = ledgerEntries.filter(led => {
    const invoiceNo = (led.invoiceNo || '').toLowerCase();
    const vendor = (led.vendor || '').toLowerCase();
    return invoiceNo.includes(searchTerm.toLowerCase()) || vendor.includes(searchTerm.toLowerCase());
  });

  // Client-side CSV Exporter
  const handleExportCSV = async () => {
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = 'audit_report.csv';

    if (activeTab === 'invoices') {
      csvContent += 'Invoice Number,Vendor Name,GSTIN,Invoice Date,Total Amount (INR),Tax Amount (INR),Risk Level,Risk Score (%),Status\n';
      filteredInvoices.forEach(inv => {
        csvContent += `"${inv_invoiceNumber(inv)}","${inv_vendor(inv)}","${inv_gstin(inv)}","${inv_date(inv)}",${inv_totalAmount(inv)},${inv_taxAmount(inv)},"${inv_riskLevel(inv)}",${inv_riskScore(inv)},"${inv.status || 'Pending'}"\n`;
      });
      filename = 'processed_invoices_report.csv';
    } else if (activeTab === 'vendors') {
      csvContent += 'Vendor Name,GSTIN,Email,Phone,Address\n';
      filteredVendors.forEach(v => {
        csvContent += `"${v.vendor || ''}","${v.gstin || ''}","${v.email || ''}","${v.phone || ''}","${v.address || ''}"\n`;
      });
      filename = 'vendor_master_report.csv';
    } else if (activeTab === 'ledger') {
      csvContent += 'Invoice Number,Vendor Name,Total Sum,Tax Amount\n';
      filteredLedger.forEach(led => {
        csvContent += `"${led.invoiceNo || ''}","${led.vendor || ''}",${led.invoiceSum || 0},${led.taxAmount || 0}\n`;
      });
      filename = 'purchase_ledger_report.csv';
    } else {
      // General overview export
      csvContent += 'Metrics,Value\n';
      csvContent += `Total Processed Invoices,${invoices.length}\n`;
      csvContent += `Total Invoice Capital (INR),${totalInvoicesVal}\n`;
      csvContent += `Reconciliation Rate (%),${reconciliationRate}%\n`;
      csvContent += `GST Validation Ratio (%),${gstValidationRate}%\n`;
      csvContent += `Duplicate Invoices,${duplicateCount}\n`;
      csvContent += `GST Discrepancy Flags,${gstErrorsCount}\n`;
      csvContent += `Ledger Reconciliation Misses,${ledgerMissesCount}\n`;
      filename = 'compliance_metrics_overview.csv';
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(false);
  };

  // Client-side PDF Exporter (Print view window compiling summaries)
  const handleGeneratePDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader size="lg" label="Assembling compliance telemetry database..." />
      </div>
    );
  }

  return (
    <div>
      {/* BROWSER VIEW DASHBOARD (Hidden in PDF Print) */}
      <div className="print:hidden space-y-8">
        
        {/* Header and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#3E0856]" />
              AI Compliance Telemetry Reports
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Audit logs matching OCR extractions against Vendor Master, Purchase Ledger, and central GSTIN databases.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGeneratePDF}
              className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Download className="h-4 w-4 text-[#3E0856]" />
              <span>Generate PDF Audit</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Export CSV Sheet</span>
            </button>
          </div>
        </div>

        {/* Grid of Telemetry Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Reconciled Capital */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute right-4 top-4 bg-purple-50 text-[#3E0856] p-1.5 rounded-lg">
              <Receipt className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoiced Capital</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-800">
                ₹{totalInvoicesVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] font-bold text-slate-400">Total</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-normal">
              Cumulative financial volume parsed by OCR. Tax aggregated: ₹{totalTaxVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}.
            </p>
          </div>

          {/* Compliance Rate */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute right-4 top-4 bg-emerald-50 text-emerald-600 p-1.5 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reconciliation Rate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-800">{reconciliationRate}%</span>
              <span className="text-xs font-bold text-emerald-600">Low Risk Match</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-normal">
              Percentage of invoices reconciled against ERP internal purchase ledgers without critical flags.
            </p>
          </div>

          {/* GST Compliance */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute right-4 top-4 bg-indigo-50 text-indigo-600 p-1.5 rounded-lg">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GST Verification Ratio</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-800">{gstValidationRate}%</span>
              <span className="text-xs font-bold text-slate-400">Active Check</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-normal">
              OCR-extracted customer & vendor GSTINs matching active Central GSTIN Database records.
            </p>
          </div>

          {/* Threat Alert counts */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute right-4 top-4 bg-rose-50 text-rose-600 p-1.5 rounded-lg">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Identified Anomalies</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-rose-600">
                {duplicateCount + ledgerMissesCount + gstErrorsCount}
              </span>
              <span className="text-xs font-bold text-rose-600">Active flags</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-normal flex flex-wrap gap-x-2">
              <span>Dups: {duplicateCount}</span> • <span>Ledger: {ledgerMissesCount}</span> • <span>GST: {gstErrorsCount}</span>
            </p>
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="flex flex-wrap border-b border-slate-200/80 gap-2">
          <button
            onClick={() => { setActiveTab('analytics'); setSearchTerm(''); }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-[#3E0856] text-[#3E0856]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics Dashboard
          </button>
          <button
            onClick={() => { setActiveTab('invoices'); setSearchTerm(''); }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'invoices'
                ? 'border-[#3E0856] text-[#3E0856]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText className="h-4 w-4" />
            Invoices Master ({invoices.length})
          </button>
          <button
            onClick={() => { setActiveTab('vendors'); setSearchTerm(''); }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'vendors'
                ? 'border-[#3E0856] text-[#3E0856]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Vendor Registry ({vendors.length})
          </button>
          <button
            onClick={() => { setActiveTab('ledger'); setSearchTerm(''); }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'border-[#3E0856] text-[#3E0856]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Receipt className="h-4 w-4" />
            Purchase Ledger ({ledgerEntries.length})
          </button>
          <button
            onClick={() => { setActiveTab('reports_list'); setSearchTerm(''); }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reports_list'
                ? 'border-[#3E0856] text-[#3E0856]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Available Audits
          </button>
        </div>

        {/* Search / Filters Bar (Visible for Data Tabs, Hidden for Charts and lists) */}
        {activeTab !== 'analytics' && activeTab !== 'reports_list' && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={
                  activeTab === 'invoices' ? "Search number, vendor name, or GSTIN..." :
                  activeTab === 'vendors' ? "Search vendor name or GSTIN..." :
                  "Search ledger number or vendor..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-xs font-medium focus:border-[#3E0856] focus:outline-none transition-colors"
              />
            </div>

            {activeTab === 'invoices' && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Risk:</span>
                </div>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:border-[#3E0856] bg-transparent"
                >
                  <option value="ALL">All Risk Levels</option>
                  <option value="HIGH">High Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="LOW">Low Risk</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:border-[#3E0856] bg-transparent"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="PENDING REVIEW">Pending Review</option>
                  <option value="DUPLICATE">Duplicate</option>
                  <option value="GST MISMATCH">GST Mismatch</option>
                  <option value="LEDGER MISSING">Ledger Missing</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Tab Contents */}
        <div className="space-y-6">

          {/* Tab 1: Analytics & Recharts */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              {/* Live Model Telemetry Warning */}
              <div className="rounded-2xl border border-[#3E0856]/10 bg-gradient-to-r from-[#3E0856]/5 to-[#601980]/5 p-5 flex items-start gap-4 shadow-sm">
                <Sparkles className="h-6 w-6 text-[#3E0856] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">AI Compliance Telemetry Engine Active</h4>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1">
                    Our Google Gemini pipeline continuously monitors new uploads, matching tax registers with purchase invoices.
                    Select any tab above to inspect records, view invoice totals, or export auditing sheets.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Processing volume */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                      <BarChart3 className="h-4.5 w-4.5 text-[#3E0856]" />
                      Processing Volume & flags
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Month-on-month processing volumes vs flagged anomalies</p>
                  </div>
                  <MonthlyInvoiceChart />
                </div>

                {/* Anomaly Category Distribution */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                      <AlertCircle className="h-4.5 w-4.5 text-[#3E0856]" />
                      Anomalies Distribution
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Breakdown of specific audit criteria triggers</p>
                  </div>
                  <VendorChart />
                </div>

                {/* Trend charts */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                      <RefreshCw className="h-4.5 w-4.5 text-[#3E0856]" />
                      Continuous Risk Engine Trend
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Evaluation model logs for compliance flags over time</p>
                  </div>
                  <RiskChart />
                </div>

              </div>
            </div>
          )}

          {/* Tab 2: Invoices Data Grid */}
          {activeTab === 'invoices' && (
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 pl-4">Invoice No</th>
                      <th className="py-3">Vendor</th>
                      <th className="py-3">GSTIN</th>
                      <th className="py-3">Date</th>
                      <th className="py-3 text-right">Tax Value</th>
                      <th className="py-3 text-right">Total Amount</th>
                      <th className="py-3 text-center">Risk</th>
                      <th className="py-3 pr-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-xs text-slate-400 font-medium">
                          No matching invoices found in database.
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv) => {
                        const invNo = inv_invoiceNumber(inv);
                        const score = inv_riskScore(inv);

                        return (
                          <tr key={invNo} className="hover:bg-slate-50/40 transition-colors text-xs">
                            <td className="py-3.5 pl-4 font-bold text-[#3E0856]">{invNo}</td>
                            <td className="py-3.5 font-semibold text-slate-700">{inv_vendor(inv)}</td>
                            <td className="py-3.5 font-mono text-[10px] text-slate-500">{inv_gstin(inv)}</td>
                            <td className="py-3.5 text-slate-500 font-medium">{inv_date(inv)}</td>
                            <td className="py-3.5 text-right font-semibold text-slate-600">
                              ₹{inv_taxAmount(inv).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 text-right font-bold text-slate-800">
                              ₹{inv_totalAmount(inv).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 text-center">
                              <span className={`inline-flex items-center justify-center rounded-lg px-2 py-0.5 font-bold text-[10px] ${
                                score >= 75
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                  : score >= 30
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>
                                {score}%
                              </span>
                            </td>
                            <td className="py-3.5 pr-4 text-right">
                              <RiskBadge status={inv.status as any} showIcon={false} />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-100 p-3 bg-slate-50/20 flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>Showing {filteredInvoices.length} of {invoices.length} invoices</span>
                <span>Secure OCR Pipeline v2.8</span>
              </div>
            </div>
          )}

          {/* Tab 3: Vendor Registry */}
          {activeTab === 'vendors' && (
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 pl-4">Vendor Name</th>
                      <th className="py-3">GSTIN</th>
                      <th className="py-3">Email Address</th>
                      <th className="py-3">Contact Phone</th>
                      <th className="py-3 pr-4">Registered Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60">
                    {filteredVendors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-slate-400 font-medium">
                          No vendors registered in the master list.
                        </td>
                      </tr>
                    ) : (
                      filteredVendors.map((v, idx) => (
                        <tr key={v.gstin || idx} className="hover:bg-slate-50/40 transition-colors text-xs">
                          <td className="py-3.5 pl-4 font-bold text-slate-800">{v.vendor}</td>
                          <td className="py-3.5">
                            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              {v.gstin}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-500 font-medium">{v.email || '—'}</td>
                          <td className="py-3.5 text-slate-500 font-medium">{v.phone || '—'}</td>
                          <td className="py-3.5 pr-4 text-slate-400 font-medium max-w-xs truncate">{v.address || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-100 p-3 bg-slate-50/20 flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>Showing {filteredVendors.length} of {vendors.length} vendors</span>
                <span>Central GSTIN verified</span>
              </div>
            </div>
          )}

          {/* Tab 4: Purchase Ledger */}
          {activeTab === 'ledger' && (
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 pl-4">Ledger Ref (Invoice No)</th>
                      <th className="py-3">Vendor / Entity</th>
                      <th className="py-3">Associated GSTIN</th>
                      <th className="py-3">Ledger Date</th>
                      <th className="py-3 text-right">Tax Amount</th>
                      <th className="py-3 pr-4 text-right">Ledger Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60">
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-xs text-slate-400 font-medium">
                          No purchase ledger reconciliation records.
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map((led, idx) => (
                        <tr key={led.invoiceNo || idx} className="hover:bg-slate-50/40 transition-colors text-xs">
                          <td className="py-3.5 pl-4 font-bold text-slate-800">{led.invoiceNo}</td>
                          <td className="py-3.5 font-semibold text-slate-700">{led.vendor}</td>
                          <td className="py-3.5 font-mono text-[10px] text-slate-500">{led.gstin || '—'}</td>
                          <td className="py-3.5 text-slate-500 font-medium">{led.invoiceDate || '—'}</td>
                          <td className="py-3.5 text-right font-semibold text-slate-600">
                            ₹{led.taxAmount ? led.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                          </td>
                          <td className="py-3.5 pr-4 text-right font-bold text-slate-800">
                            ₹{led.invoiceSum ? led.invoiceSum.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-100 p-3 bg-slate-50/20 flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>Showing {filteredLedger.length} of {ledgerEntries.length} ledger entries</span>
                <span>Internal ERP synchrony</span>
              </div>
            </div>
          )}

          {/* Tab 5: Available Audits List */}
          {activeTab === 'reports_list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* GST Report */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 hover:border-[#3E0856]/20 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-100">
                    Compliance Report
                  </span>
                  <h3 className="text-sm font-bold text-slate-800">GSTIN Registry Discrepancy Log</h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Consolidated compliance check detailing invoice tax coordinates compared against central tax database entries.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                  <span>Record count: {gstErrorsCount} failures</span>
                  <button 
                    onClick={() => { setActiveTab('invoices'); setStatusFilter('GST MISMATCH'); }}
                    className="flex items-center gap-1 text-[#3E0856] hover:text-[#FAAE62] transition-all cursor-pointer"
                  >
                    <span>Query Records</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Duplicate Invoices Report */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 hover:border-[#3E0856]/20 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-700 border border-rose-100">
                    Risk Log
                  </span>
                  <h3 className="text-sm font-bold text-slate-800">Suspected Double-Billings</h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Risk engine scans targeting multiple uploads matching vendors, dates, and amounts.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                  <span>Record count: {duplicateCount} occurrences</span>
                  <button 
                    onClick={() => { setActiveTab('invoices'); setStatusFilter('DUPLICATE'); }}
                    className="flex items-center gap-1 text-[#3E0856] hover:text-[#FAAE62] transition-all cursor-pointer"
                  >
                    <span>Query Records</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Reconciliation Report */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 hover:border-[#3E0856]/20 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700 border border-indigo-100">
                    Ledger Log
                  </span>
                  <h3 className="text-sm font-bold text-slate-800">ERP Ledger Unreconciled entries</h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Matches OCR parsed invoices against purchase orders and internal bank disbursement routing.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                  <span>Record count: {ledgerMissesCount} unmatched</span>
                  <button 
                    onClick={() => { setActiveTab('invoices'); setStatusFilter('LEDGER MISSING'); }}
                    className="flex items-center gap-1 text-[#3E0856] hover:text-[#FAAE62] transition-all cursor-pointer"
                  >
                    <span>Query Records</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Global telemetry audit */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 hover:border-[#3E0856]/20 transition-all flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[9px] font-bold text-[#3E0856] border border-[#3E0856]/10">
                    Global Audit
                  </span>
                  <h3 className="text-sm font-bold text-slate-800">Consolidated Master compliance log</h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    The complete repository overview, combining high-risk OCR scores, AI justifications, and metadata details.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                  <span>Record count: {invoices.length} total entries</span>
                  <button 
                    onClick={() => { setActiveTab('invoices'); setStatusFilter('ALL'); }}
                    className="flex items-center gap-1 text-[#3E0856] hover:text-[#FAAE62] transition-all cursor-pointer"
                  >
                    <span>Query Records</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* System compliance footer */}
        <div className="border-t border-slate-200 pt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
          <div className="flex items-center gap-1 text-[#3E0856]">
            <TrendingUp className="h-4 w-4" />
            <span>Real-time telemetry buffer active</span>
          </div>
          <div>
            <span>Powered by Gemini 3.5 Flash • Invexa AI</span>
          </div>
        </div>

      </div>

      {/* CORPORATE PRINT-ONLY AUDIT DOSSIER (Visible ONLY in PDF download / print mode) */}
      <div className="hidden print:block text-slate-900 font-sans leading-relaxed max-w-4xl mx-auto p-4 space-y-8">
        
        {/* Document Corporate Title Header */}
        <div className="border-b-4 border-[#3E0856] pb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-[#3E0856] tracking-tight uppercase">Invexa AI COMPLIANCE AUDIT</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1.5">
                AI-Powered System Audit & Reconciliation Ledger Report
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-400 font-bold bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>GEN-REF: INVEXA-2026-08</div>
              <div>DATE: {new Date().toLocaleDateString('en-IN')}</div>
              <div>STATUS: SECURED & VERIFIED</div>
            </div>
          </div>
        </div>

        {/* Executive Summary Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1 uppercase tracking-wider">
            1. Executive Audit Summary
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            This document registers the compliance results compiled by the Invexa AI pipeline. A total of <strong className="text-slate-800">{invoices.length} invoices</strong> were analyzed and cross-referenced against the central tax database registries, registered Vendor Masters, and internal Purchase Ledger structures. 
            The neural processing pipeline flagged <strong className="text-rose-600">{(duplicateCount + ledgerMissesCount + gstErrorsCount)} compliance irregularities</strong> requiring human verification and authorization.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="border border-slate-200/80 bg-slate-50/50 p-4 rounded-xl space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Audited Financial Capital</span>
              <div className="text-lg font-black text-[#3E0856]">
                ₹{totalInvoicesVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[9px] text-slate-400 font-bold">Total tax processed: ₹{totalTaxVal.toLocaleString('en-IN')}</p>
            </div>
            
            <div className="border border-slate-200/80 bg-slate-50/50 p-4 rounded-xl space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">System Match Rate</span>
              <div className="text-lg font-black text-emerald-600">{reconciliationRate}%</div>
              <p className="text-[9px] text-slate-400 font-bold">GST match accuracy: {gstValidationRate}%</p>
            </div>
          </div>
        </div>

        {/* Page Break */}
        <div style={{ pageBreakBefore: 'always', height: 0 }}></div>

        {/* Telemetry Threat Matrix */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1 uppercase tracking-wider">
            2. Anomalies & Threat Matrix
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Summary of verification signals and deviations flagged during character parsing and database reconciliation.
          </p>
          
          <div className="grid grid-cols-3 gap-4 text-center mt-2">
            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/30">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duplicate Uploads</div>
              <div className="text-3xl font-black text-rose-600 mt-2">{duplicateCount}</div>
              <div className="text-[9px] text-slate-400 font-semibold mt-1.5">Duplicate invoice numbers</div>
            </div>
            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/30">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">GSTIN Validation Failures</div>
              <div className="text-3xl font-black text-amber-600 mt-2">{gstErrorsCount}</div>
              <div className="text-[9px] text-slate-400 font-semibold mt-1.5">Mismatched central tax IDs</div>
            </div>
            <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/30">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ledger Mismatches</div>
              <div className="text-3xl font-black text-indigo-600 mt-2">{ledgerMissesCount}</div>
              <div className="text-[9px] text-slate-400 font-semibold mt-1.5">Missing ERP registry logs</div>
            </div>
          </div>

          <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/20 text-[10px] text-slate-500 font-medium leading-relaxed mt-4">
            <strong>Verification Protocol:</strong> Extraction involves multi-character OCR segmentation. System matching correlates vendor billing records with the Central Board of Indirect Taxes database. Discrepancies are flagged for immediate operational audit.
          </div>
        </div>

        {/* Page Break */}
        <div style={{ pageBreakBefore: 'always', height: 0 }}></div>

        {/* Invoices Master Table */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1 uppercase tracking-wider">
            3. Processed Invoices Audit Ledger
          </h2>
          <table className="w-full text-left border-collapse text-[10px] mt-2">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 pl-2">Invoice No</th>
                <th className="py-2.5">Vendor Name</th>
                <th className="py-2.5">GSTIN</th>
                <th className="py-2.5">Date</th>
                <th className="py-2.5 text-right">Tax (INR)</th>
                <th className="py-2.5 text-right">Total Amount (INR)</th>
                <th className="py-2.5 text-center">Risk</th>
                <th className="py-2.5 pr-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-slate-400">No invoices audited.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv_invoiceNumber(inv)} className="py-2 hover:bg-slate-50/30">
                    <td className="py-2 pl-2 font-bold text-[#3E0856]">{inv_invoiceNumber(inv)}</td>
                    <td className="py-2 font-bold text-slate-700">{inv_vendor(inv)}</td>
                    <td className="py-2 font-mono text-[9px] text-slate-500">{inv_gstin(inv)}</td>
                    <td className="py-2 text-slate-500">{inv_date(inv)}</td>
                    <td className="py-2 text-right text-slate-600">₹{inv_taxAmount(inv).toFixed(2)}</td>
                    <td className="py-2 text-right font-bold text-slate-800">₹{inv_totalAmount(inv).toFixed(2)}</td>
                    <td className="py-2 text-center font-bold text-slate-700">{inv_riskScore(inv)}%</td>
                    <td className="py-2 pr-2 text-right text-slate-700 font-semibold">{inv.status || 'Pending'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Page Break */}
        <div style={{ pageBreakBefore: 'always', height: 0 }}></div>

        {/* Vendor Master Table */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1 uppercase tracking-wider">
            4. Registered Vendor Verification Database
          </h2>
          <table className="w-full text-left border-collapse text-[10px] mt-2">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 pl-2">Vendor Name</th>
                <th className="py-2.5">GSTIN Address</th>
                <th className="py-2.5">Email Address</th>
                <th className="py-2.5">Phone Contact</th>
                <th className="py-2.5 pr-2">Registered Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">No vendor records.</td>
                </tr>
              ) : (
                vendors.map((v, idx) => (
                  <tr key={v.gstin || idx} className="py-2">
                    <td className="py-2 pl-2 font-bold text-slate-800">{v.vendor}</td>
                    <td className="py-2 font-mono text-emerald-700 font-semibold">{v.gstin}</td>
                    <td className="py-2 text-slate-500">{v.email || '—'}</td>
                    <td className="py-2 text-slate-500">{v.phone || '—'}</td>
                    <td className="py-2 pr-2 text-slate-400 max-w-xs truncate">{v.address || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Page Break */}
        <div style={{ pageBreakBefore: 'always', height: 0 }}></div>

        {/* Purchase Ledger Table */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1 uppercase tracking-wider">
            5. ERP Purchase Ledger Records
          </h2>
          <table className="w-full text-left border-collapse text-[10px] mt-2">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 pl-2">Ledger Reference No</th>
                <th className="py-2.5">Vendor Name</th>
                <th className="py-2.5">Associated GSTIN</th>
                <th className="py-2.5">Ledger Date</th>
                <th className="py-2.5 text-right">Tax Value</th>
                <th className="py-2.5 pr-2 text-right">Ledger Total Sum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">No ledger entries.</td>
                </tr>
              ) : (
                ledgerEntries.map((led, idx) => (
                  <tr key={led.invoiceNo || idx} className="py-2">
                    <td className="py-2 pl-2 font-bold text-slate-800">{led.invoiceNo}</td>
                    <td className="py-2 font-bold text-slate-700">{led.vendor}</td>
                    <td className="py-2 font-mono text-[9px] text-slate-500">{led.gstin || '—'}</td>
                    <td className="py-2 text-slate-500">{led.invoiceDate || '—'}</td>
                    <td className="py-2 text-right text-slate-600">₹{(led.taxAmount || 0).toFixed(2)}</td>
                    <td className="py-2 pr-2 text-right font-bold text-slate-800">₹{(led.invoiceSum || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Page Break */}
        <div style={{ pageBreakBefore: 'always', height: 0 }}></div>

        {/* Sign-Off Authorization Section */}
        <div className="space-y-8 pt-6">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1 uppercase tracking-wider">
            6. Audit Verification & Sign-Off Authorization
          </h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            This compliance dossier contains automated audit telemetry generated by the Invexa AI on {new Date().toLocaleDateString('en-IN')}. 
            All documents have been scanned via OCR and analyzed by Google Gemini AI risk models. 
            By signing below, the authorized audit committee resolves to accept these findings.
          </p>

          <div className="grid grid-cols-2 gap-16 pt-12">
            <div className="space-y-4">
              <div className="border-b border-slate-400 h-8"></div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Compliance Officer Signature
              </div>
            </div>
            <div className="space-y-4">
              <div className="border-b border-slate-400 h-8"></div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Audit Committee Lead Signature
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
