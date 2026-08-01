'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter, ArrowUpDown, ArrowRight, Download, FileSpreadsheet, AlertTriangle, X } from 'lucide-react';
import { fetchInvoices, type InvoiceRecord } from '@/lib/api';
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

  const loadInvoices = () => {
    setLoading(true);
    fetchInvoices()
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

  useEffect(() => {
    loadInvoices();
  }, []);

  // Filter and Sort logic
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const invNo = inv.invoice_number || '';
        const vendor = inv.vendor || '';
        const gstin = inv.vendor_gstin || '';

        const matchesSearch =
          invNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          gstin.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;

        let matchesRisk = true;
        const score = inv.risk_score != null ? inv.risk_score : (inv.risk_level === 'High' ? 85 : inv.risk_level === 'Medium' ? 45 : 10);
        if (riskFilter === 'HIGH') matchesRisk = score >= 75;
        else if (riskFilter === 'MEDIUM') matchesRisk = score >= 30 && score < 75;
        else if (riskFilter === 'LOW') matchesRisk = score < 30;

        return matchesSearch && matchesStatus && matchesRisk;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'date') {
          const dateA = a.invoice_date || a.upload_time || '';
          const dateB = b.invoice_date || b.upload_time || '';
          comparison = new Date(dateA).getTime() - new Date(dateB).getTime();
        } else if (sortBy === 'amount') {
          const valA = a.total_amount != null ? a.total_amount : (a.total != null ? a.total : 0);
          const valB = b.total_amount != null ? b.total_amount : (b.total != null ? b.total : 0);
          comparison = valA - valB;
        } else if (sortBy === 'riskScore') {
          const scoreA = a.risk_score != null ? a.risk_score : (a.risk_level === 'High' ? 85 : a.risk_level === 'Medium' ? 45 : 10);
          const scoreB = b.risk_score != null ? b.risk_score : (b.risk_level === 'High' ? 85 : b.risk_level === 'Medium' ? 45 : 10);
          comparison = scoreA - scoreB;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [invoices, searchTerm, statusFilter, riskFilter, sortBy, sortOrder]);

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
          <button className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all">
            <Download className="h-4 w-4 text-[#3E0856]" />
            <span>PDF Summary</span>
          </button>
          <button className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        {/* Search */}
        <div className="relative lg:col-span-5">
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

        {/* Clear Filters Button */}
        <button
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('ALL');
            setRiskFilter('ALL');
          }}
          className="lg:col-span-2 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-xs font-bold text-slate-500 py-2.5 transition-colors cursor-pointer"
        >
          Reset Filters
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
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.invoice_number} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 pl-2">
                      <Link
                        href={`/invoices/${inv.invoice_number}`}
                        className="font-bold text-xs text-[#3E0856] hover:underline"
                      >
                        {inv.invoice_number ?? '—'}
                      </Link>
                    </td>
                    <td className="py-3.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">
                          {inv.vendor}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight mt-0.5">
                          {inv.vendor_gstin ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-xs font-semibold text-slate-500">
                      {inv.invoice_date || (inv.upload_time ? new Date(inv.upload_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')}
                    </td>
                    <td className="py-3.5 text-right text-xs font-bold text-slate-700">
                      ₹{(inv.total_amount != null ? inv.total_amount : (inv.total != null ? inv.total : 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="inline-flex items-center justify-center rounded-lg bg-slate-50 border border-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {inv.confidence != null ? `${inv.confidence.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      {(() => {
                        const score = inv.risk_score != null ? inv.risk_score : (inv.risk_level === 'High' ? 85 : inv.risk_level === 'Medium' ? 45 : 10);
                        return (
                          <span className={`inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-xs font-bold ${
                            score >= 75
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : score >= 30
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {score}%
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <RiskBadge status={inv.status as any} showIcon={false} />
                        <Link
                          href={`/invoices/${inv.invoice_number}`}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-[#3E0856] rounded hover:bg-slate-100 transition-all duration-200"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
