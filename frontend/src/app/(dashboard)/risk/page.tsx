'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { fetchInvoices, type InvoiceRecord, inv_invoiceNumber, inv_vendor, inv_gstin, inv_riskScore, inv_confidence, inv_totalAmount } from '@/lib/api';
import EmptyState from '@/components/common/EmptyState';
import Loader from '@/components/common/Loader';
import Pagination from '@/components/common/Pagination';
import Link from 'next/link';

export default function RiskDetectionPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [anomalyFilter, setAnomalyFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const loadData = (page = currentPage, search = searchTerm, anomaly = anomalyFilter, severity = severityFilter) => {
    setLoading(true);
    setError(null);
    fetchInvoices({
      search: search || undefined,
      status: anomaly !== 'ALL' ? anomaly : undefined,
      risk: severity !== 'ALL' ? severity : undefined,
      page,
    })
      .then((res) => {
        setInvoices(res.invoices || []);
        setTotalPages(res.total_pages || 1);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch risk data');
        setInvoices([]);
        setTotalPages(1);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData(1);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, anomalyFilter, severityFilter]);

  useEffect(() => {
    loadData(currentPage, searchTerm, anomalyFilter, severityFilter);
  }, [currentPage, searchTerm, anomalyFilter, severityFilter]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setSearchTerm(searchInput);
    }
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setAnomalyFilter('ALL');
    setSeverityFilter('ALL');
    setCurrentPage(1);
  };

  const anomalyOptions = [
    'ALL',
    'High Risk',
    'Pending Review',
    'Passed',
  ];

  const severityOptions = [
    'ALL',
    'HIGH',
    'MEDIUM',
    'LOW',
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-rose-500" />
            <span className="text-xs font-bold text-rose-700">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/80 p-3.5 shadow-sm">
        <div className="relative lg:col-span-5">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice or vendor..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-10 pr-4 text-xs font-medium text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-[#3E0856] focus:bg-white focus:ring-1 focus:ring-[#3E0856]"
          />
        </div>

        <div className="relative lg:col-span-3">
          <select
            value={anomalyFilter}
            onChange={(e) => setAnomalyFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-3.5 pr-9 text-xs font-medium text-slate-700 outline-none appearance-none transition-all focus:border-[#3E0856] focus:bg-white cursor-pointer"
          >
            {anomalyOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'ALL' ? 'All Anomaly Types' : opt}
              </option>
            ))}
          </select>
          <Filter className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative lg:col-span-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-3.5 pr-9 text-xs font-medium text-slate-700 outline-none appearance-none transition-all focus:border-[#3E0856] focus:bg-white cursor-pointer"
          >
            {severityOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'ALL' ? 'All Severities' : opt}
              </option>
            ))}
          </select>
          <Filter className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>

        <button
          onClick={resetFilters}
          className="lg:col-span-2 flex items-center justify-center rounded-xl bg-slate-100/70 hover:bg-slate-200/80 border border-slate-200/50 text-xs font-bold text-slate-600 py-2 px-3 transition-colors cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="py-16">
            <Loader size="md" label="Loading Risk Detection anomalies..." />
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No risk anomalies found"
              description="No invoice records matched the selected search or risk criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 pl-4 w-10"></th>
                  <th className="py-3.5 px-3">INVOICE NO</th>
                  <th className="py-3.5 px-3">VENDOR</th>
                  <th className="py-3.5 px-3">ANOMALY TYPE</th>
                  <th className="py-3.5 px-3 text-center">RISK SCORE</th>
                  <th className="py-3.5 px-3 text-center">CONFIDENCE</th>
                  <th className="py-3.5 pr-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv, idx) => {
                  const invNo = inv_invoiceNumber(inv);
                  const rowKey = inv._id || `${invNo}-${idx}`;
                  const isExpanded = !!expandedRows[rowKey];
                  const vendorName = inv_vendor(inv);
                  const gstin = inv_gstin(inv);
                  const score = inv_riskScore(inv);
                  const confidenceVal = inv_confidence(inv);
                  const statusLabel = inv.status || 'Pending Review';
                  const exceptions = inv.exceptions || [];

                  return (
                    <React.Fragment key={rowKey}>
                      <tr
                        className={`group hover:bg-slate-50/70 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-slate-50/60' : ''
                        }`}
                        onClick={() => toggleRow(rowKey)}
                      >
                        <td className="py-3.5 pl-4 text-slate-400 group-hover:text-slate-600">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-xs text-[#3E0856] group-hover:underline">
                            {invNo}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">
                              {vendorName}
                            </span>
                            <span className="text-[9px] font-semibold text-slate-400 tracking-tight mt-0.5">
                              {gstin || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center px-3 py-1 text-[11px] font-bold rounded-full bg-[#FEF6E6] text-[#D97706] border border-[#FDE68A]">
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded-full bg-[#FEF6E6] text-[#D97706] border border-[#FDE68A]">
                            {score}%
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="text-xs font-bold text-slate-600">
                            {confidenceVal != null ? `${confidenceVal.toFixed(1)}%` : '—'}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/invoices/${invNo}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-bold text-slate-600 hover:text-[#3E0856] hover:border-[#3E0856] hover:bg-purple-50/50 transition-all cursor-pointer shadow-2xs"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#3E0856]" />
                            <span>Analyze</span>
                          </Link>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={7}
                            className="bg-slate-50/70 p-5 border-t border-b border-slate-200/60"
                          >
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 bg-white rounded-xl border border-slate-200/70 p-4 shadow-2xs">
                              <div className="lg:col-span-8 space-y-3">
                                <div className="flex items-start gap-2">
                                  <Info className="h-4.5 w-4.5 text-[#3E0856] shrink-0 mt-0.5" />
                                  <div>
                                    <h4 className="font-bold text-slate-800 text-xs">
                                      AI Risk Diagnostics & Audit Analysis
                                    </h4>
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">
                                      {exceptions.length === 0
                                        ? 'Invoice flagged during rule engine validation. Vendor GSTIN and PO pricing variance detected.'
                                        : `Detected ${exceptions.length} compliance exception(s) requiring auditor verification.`}
                                    </p>
                                  </div>
                                </div>

                                {exceptions.length > 0 && (
                                  <div className="rounded-lg border border-amber-200/80 bg-amber-50/30 p-3 space-y-2">
                                    <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block">
                                      Anomalous Rule Exceptions
                                    </span>
                                    <div className="space-y-1.5">
                                      {exceptions.map((flag, i) => (
                                        <div
                                          key={i}
                                          className="flex items-center justify-between text-xs font-semibold"
                                        >
                                          <span className="text-slate-700">{flag.check}</span>
                                          <span className="text-slate-500 text-right text-[11px]">
                                            {flag.detail}
                                          </span>
                                          <span className="text-amber-700 uppercase text-[9px] font-bold bg-amber-100/80 px-2 py-0.5 rounded-full ml-2">
                                            {flag.severity}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="lg:col-span-4 border-l border-slate-100 pl-5 space-y-3 flex flex-col justify-between">
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between pb-1.5 border-b border-slate-100">
                                    <span className="text-slate-400 font-medium">Invoice Value</span>
                                    <span className="font-bold text-slate-800">
                                      ₹{inv_totalAmount(inv).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex justify-between pb-1.5 border-b border-slate-100">
                                    <span className="text-slate-400 font-medium">Confidence</span>
                                    <span className="font-bold text-slate-800">
                                      {confidenceVal != null ? `${confidenceVal.toFixed(1)}%` : '—'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400 font-medium">GSTIN</span>
                                    <span className="font-bold text-slate-800">
                                      {gstin || '—'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-1">
                                  <button className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 py-1.5 active:scale-95 transition-all cursor-pointer">
                                    <XCircle className="h-3.5 w-3.5 text-rose-500" />
                                    <span>Hold Payment</span>
                                  </button>
                                  <button className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-[#3E0856] text-white hover:bg-[#3E0856]/90 text-[11px] font-bold py-1.5 active:scale-95 transition-all cursor-pointer">
                                    <CheckCircle className="h-3.5 w-3.5 text-[#FAAE62]" />
                                    <span>Override Safe</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && invoices.length > 0 && totalPages > 1 && (
          <div className="px-4 pb-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
