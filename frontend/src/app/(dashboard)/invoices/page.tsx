'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter, ArrowUpDown, ArrowRight, Download, FileSpreadsheet, AlertTriangle, X, ChevronDown } from 'lucide-react';
import { fetchInvoices, BASE_URL, type InvoiceRecord, inv_invoiceNumber, inv_vendor, inv_gstin, inv_date, inv_taxAmount, inv_totalAmount, inv_riskScore, inv_confidence, inv_uploadTime } from '@/lib/api';
import RiskBadge from '@/components/common/RiskBadge';
import EmptyState from '@/components/common/EmptyState';
import Loader from '@/components/common/Loader';

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-2xl border border-rose-200 bg-white px-4 py-3.5 shadow-xl max-w-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold text-slate-800">Fetch Failed</span>
        <span className="text-[11px] text-slate-500 leading-relaxed">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="ml-auto shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'riskScore'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const loadInvoices = (searchVal = searchTerm, statusVal = statusFilter, riskVal = riskFilter) => {
    setLoading(true);
    fetchInvoices({
      search: searchVal,
      status: statusVal,
      risk: riskVal
    })
      .then((res) => {
        setInvoices(res.invoices || []);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Download PDF report for a specific invoice
  const handlePdf = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/invoices/${id}/report`);
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}_report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || 'PDF download error');
    }
  };

  // Download CSV export for a specific invoice
  const handleCsv = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/invoices/${id}/csv`);
      if (!res.ok) throw new Error('Failed to generate CSV');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}_export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || 'CSV download error');
    }
  };

  const handleAllPdf = async () => {
    if (filteredInvoices.length === 0) { setError('No invoices to export'); return; }
    try {
      const lines: string[] = [
        'TETRA Invoice Summary Report',
        `Generated: ${new Date().toLocaleString('en-IN')}`,
        `Total Invoices: ${filteredInvoices.length}`,
        '',
        ...filteredInvoices.map((inv, i) => {
          const no = inv_invoiceNumber(inv);
          const v = inv_vendor(inv);
          const total = inv_totalAmount(inv);
          const score = inv_riskScore(inv);
          return `${i + 1}. ${no} | ${v} | ₹${total.toLocaleString('en-IN')} | Risk: ${score}%`;
        }),
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TETRA_Invoice_Summary_${new Date().toISOString().slice(0,10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || 'Summary export error');
    }
  };

  const handleAllCsv = async () => {
    if (filteredInvoices.length === 0) { setError('No invoices to export'); return; }
    try {
      const headers = ['Invoice No', 'Vendor', 'GSTIN', 'Date', 'Tax Amount', 'Total Amount', 'Risk Score', 'Confidence'];
      const rows = filteredInvoices.map(inv => [
        inv_invoiceNumber(inv),
        inv_vendor(inv),
        inv_gstin(inv),
        inv_date(inv) || inv_uploadTime(inv),
        inv_taxAmount(inv),
        inv_totalAmount(inv),
        inv_riskScore(inv),
        inv_confidence(inv) ?? '',
      ]);
      const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TETRA_Invoices_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || 'CSV export error');
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadInvoices(searchTerm, statusFilter, riskFilter);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, statusFilter, riskFilter]);

  // Sort logic (filtering is done on backend)
  const filteredInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        const dateA = inv_date(a) || inv_uploadTime(a);
        const dateB = inv_date(b) || inv_uploadTime(b);
        comparison = new Date(dateA).getTime() - new Date(dateB).getTime();
      } else if (sortBy === 'amount') {
        comparison = inv_totalAmount(a) - inv_totalAmount(b);
      } else if (sortBy === 'riskScore') {
        comparison = inv_riskScore(a) - inv_riskScore(b);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [invoices, sortBy, sortOrder]);

  const handleSort = (field: 'date' | 'amount' | 'riskScore') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const statusOptions = ['ALL', 'Verified', 'High Risk', 'Pending Review', 'Duplicate', 'GST Mismatch', 'Ledger Missing'];

  return (
    <div className="space-y-8">
      {error && <Toast message={error} onClose={() => setError(null)} />}

      {/* Header action panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Invoice Telemetry Directory</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            View compliance scores, anomaly checks, and OCR verification states.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleAllPdf} className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all">
            <Download className="h-4 w-4 text-[#3E0856]" />
            <span>PDF Summary</span>
          </button>
          <button onClick={handleAllCsv} className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-14 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        {/* Search */}
        <div className="relative lg:col-span-4">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number, vendor, GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs outline-none transition-all focus:border-[#3E0856] focus:bg-white focus:ring-1 focus:ring-[#3E0856]"
          />
        </div>

        {/* Status Filter */}
        <div className="relative lg:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none appearance-none transition-all focus:border-[#3E0856] focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Compliance Statuses</option>
            {statusOptions.slice(1).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <Filter className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Risk Filter */}
        <div className="relative lg:col-span-2">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none appearance-none transition-all focus:border-[#3E0856] focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High (Score &gt;= 75)</option>
            <option value="MEDIUM">Medium (Score 30-74)</option>
            <option value="LOW">Low (Score &lt; 30)</option>
          </select>
          <Filter className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Sort By */}
        <div className="relative lg:col-span-2">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as 'date' | 'amount' | 'riskScore');
              setSortOrder(order as 'desc' | 'asc');
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none appearance-none transition-all focus:border-[#3E0856] focus:bg-white cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
            <option value="riskScore-desc">Highest Risk</option>
            <option value="riskScore-asc">Lowest Risk</option>
          </select>
          <ArrowUpDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Clear Filters Button */}
        <button
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('ALL');
            setRiskFilter('ALL');
            setSortBy('date');
            setSortOrder('desc');
          }}
          className="lg:col-span-1 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-xs font-bold text-slate-500 py-2.5 transition-colors cursor-pointer"
        >
          Reset
        </button>
      </div>

      {/* Main Table card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm min-h-[200px] flex flex-col justify-center">
        {loading ? (
          <Loader size="md" label="Loading telemetry directory..." />
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            title="No invoices found matching criteria"
            description="Adjust your search tags, verify the filters, or ingest new bills to run scans."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider select-none">
                  <th className="pb-3 pl-2">Invoice No</th>
                  <th className="pb-3">Vendor</th>
                  <th className="pb-3 cursor-pointer hover:text-slate-600" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">
                      <span>Invoice Date</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="pb-3 text-right">Tax Amount</th>
                  <th className="pb-3 text-right cursor-pointer hover:text-slate-600" onClick={() => handleSort('amount')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Total Amount</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="pb-3 text-center">Confidence</th>
                  <th className="pb-3 text-center cursor-pointer hover:text-slate-600" onClick={() => handleSort('riskScore')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Risk Score</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="pb-3 pr-2 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {filteredInvoices.map((inv) => {
                  const invNum = inv_invoiceNumber(inv);
                  const vendorName = inv_vendor(inv);
                  const gstinVal = inv_gstin(inv);
                  const dateVal = inv_date(inv);
                  const taxVal = inv_taxAmount(inv);
                  const totalVal = inv_totalAmount(inv);
                  const score = inv_riskScore(inv);
                  const conf = inv_confidence(inv);
                  const uploadVal = inv_uploadTime(inv);
                  return (
                  <tr key={invNum} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 pl-2">
                      <Link
                        href={`/invoices/${inv._id}`}
                        className="font-bold text-xs text-[#3E0856] hover:underline"
                      >
                        {invNum}
                      </Link>
                    </td>
                    <td className="py-3.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">
                          {vendorName}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight mt-0.5">
                          {gstinVal}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-xs font-semibold text-slate-500">
                      {dateVal || (uploadVal ? new Date(uploadVal).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')}
                    </td>
                    <td className="py-3.5 text-right text-xs font-bold text-slate-700">
                      ₹{taxVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 text-right text-xs font-bold text-slate-700">
                      ₹{totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="inline-flex items-center justify-center rounded-lg bg-slate-50 border border-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {conf != null ? `${conf.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className={`inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-xs font-bold ${
                        score >= 75
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : score >= 30
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {score}%
                      </span>
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/invoices/${inv._id}`}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-[#3E0856] rounded hover:bg-slate-100 transition-all duration-200"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handlePdf(inv._id || '')}
                          className="p-1 text-slate-400 hover:text-[#3E0856]"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCsv(inv._id || '')}
                          className="p-1 text-slate-400 hover:text-[#3E0856]"
                          title="Download CSV"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
