'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Eye,
  Info,
} from 'lucide-react';
import { fetchInvoices, type InvoiceRecord } from '@/lib/api';
import RiskBadge from '@/components/common/RiskBadge';
import EmptyState from '@/components/common/EmptyState';
import Loader from '@/components/common/Loader';
import Link from 'next/link';

export default function RiskPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    setLoading(true);
    fetchInvoices()
      .then((res) => {
        setInvoices(res.invoices || []);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load risk anomalies');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter invoices to only show flagged items (status != Verified)
  const riskInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.status !== 'Verified');
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return riskInvoices.filter((inv) => {
      const invNo = inv.invoice_number || '';
      const vendorName = inv.vendor || '';

      const matchesSearch =
        invNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendorName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = typeFilter === 'ALL' || inv.status === typeFilter;

      let matchesSeverity = true;
      const score = inv.risk_score || 0;
      if (severityFilter === 'High') matchesSeverity = score >= 75;
      else if (severityFilter === 'Medium') matchesSeverity = score >= 30 && score < 75;
      else if (severityFilter === 'Low') matchesSeverity = score < 30;

      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [riskInvoices, searchTerm, severityFilter, typeFilter]);

  const riskTypes = ['ALL', 'Duplicate', 'GST Mismatch', 'Ledger Missing', 'High Risk', 'Pending Review'];

  return (
    <div className="space-y-8">
      {/* Welcome & Overview */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-5.5 w-5.5 text-[#3E0856]" />
            AI Risk Detection Engine
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Identify accounting anomalies, tax routing issues, and duplicate invoice billing instantly.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        {/* Search */}
        <div className="relative lg:col-span-5">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs outline-none transition-all focus:border-[#3E0856] focus:bg-white focus:ring-1 focus:ring-[#3E0856]"
          />
        </div>

        {/* Risk Type Filter */}
        <div className="relative lg:col-span-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none appearance-none transition-all focus:border-[#3E0856] focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Anomaly Types</option>
            {riskTypes.slice(1).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <Filter className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Severity Filter */}
        <div className="relative lg:col-span-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none appearance-none transition-all focus:border-[#3E0856] focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="High">High Severity</option>
            <option value="Medium">Medium Severity</option>
            <option value="Low">Low Severity</option>
          </select>
          <Filter className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            setSearchTerm('');
            setSeverityFilter('ALL');
            setTypeFilter('ALL');
          }}
          className="lg:col-span-2 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-xs font-bold text-slate-500 py-2.5 transition-colors cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

      {/* Flagged Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm min-h-[200px] flex flex-col justify-center">
        {loading ? (
          <Loader size="md" label="Analyzing flagged anomalies..." />
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            title="No anomalies flagged"
            description="All active invoices meet compliance criteria and PO ledger reconciliations."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2 w-8"></th>
                  <th className="pb-3">Invoice No</th>
                  <th className="pb-3">Vendor</th>
                  <th className="pb-3">Anomaly Type</th>
                  <th className="pb-3 text-center">Risk Score</th>
                  <th className="pb-3 text-center">Confidence</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {filteredInvoices.map((inv) => {
                  const invNo = inv.invoice_number || '';
                  const isExpanded = !!expandedRows[invNo];
                  const exceptions = inv.exceptions || [];

                  return (
                    <React.Fragment key={invNo}>
                      {/* Row Item */}
                      <tr
                        className={`group hover:bg-slate-50/50 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-slate-50/30' : ''
                        }`}
                        onClick={() => toggleRow(invNo)}
                      >
                        <td className="py-4 pl-2">
                          {isExpanded ? (
                            <ChevronUp className="h-4.5 w-4.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4.5 w-4.5 text-slate-400" />
                          )}
                        </td>
                        <td className="py-4 font-bold text-xs text-[#3E0856]">
                          {invNo}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-700">
                              {inv.vendor}
                            </span>
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight mt-0.5">
                              {inv.vendor_gstin || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <RiskBadge status={inv.status as any} showIcon={false} />
                        </td>
                        <td className="py-4 text-center">
                          {(() => {
                            const score = inv.risk_score != null ? inv.risk_score : (inv.risk_level === 'High' ? 85 : inv.risk_level === 'Medium' ? 45 : 10);
                            return (
                              <span className={`inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-xs font-bold ${
                                score >= 75
                                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {score}%
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-4 text-center text-xs font-bold text-slate-500">
                          {inv.confidence != null ? `${inv.confidence.toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-4 pr-2 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2.5">
                            <Link
                              href={`/invoices/${invNo}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-[#3E0856] hover:bg-slate-50 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Analyze</span>
                            </Link>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable details segment */}
                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={7}
                            className="bg-slate-50/50 p-6 border-t border-b border-slate-100/80"
                          >
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                              {/* Left detail: AI report */}
                              <div className="lg:col-span-8 space-y-4">
                                <div className="flex items-start gap-2">
                                  <Info className="h-4.5 w-4.5 text-[#3E0856] shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                    <h4 className="font-bold text-slate-700 text-xs">
                                      AI Diagnostics Analysis
                                    </h4>
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                                      {exceptions.length === 0
                                        ? 'Compliance classification verified safe. No exceptions registered.'
                                        : `Detected ${exceptions.length} compliance warning(s) that match anomalous billing behaviors. Please reconcile with ERP database.`}
                                    </p>
                                  </div>
                                </div>

                                {exceptions.length > 0 && (
                                  <div className="border border-rose-100 bg-rose-50/10 rounded-xl p-4 space-y-2">
                                    <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wider block">
                                      Compliance Mismatches Identified
                                    </span>
                                    <div className="space-y-1.5">
                                      {exceptions.map((flag: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between text-xs font-semibold"
                                        >
                                          <span className="text-slate-600">{flag.check}</span>
                                          <span className="text-slate-500 text-right max-w-xs">{flag.detail}</span>
                                          <span className="text-rose-600 uppercase text-[9px] font-bold">
                                            {flag.severity}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Right details: stats & action shortcuts */}
                              <div className="lg:col-span-4 border-l border-slate-200/60 pl-6 space-y-4 flex flex-col justify-between">
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between pb-1.5 border-b border-slate-100">
                                    <span className="text-slate-400 font-semibold">
                                      Invoice Value
                                    </span>
                                    <span className="font-bold text-slate-700">
                                      ₹
                                      {(inv.total_amount != null ? inv.total_amount : (inv.total != null ? inv.total : 0)).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex justify-between pb-1.5 border-b border-slate-100">
                                    <span className="text-slate-400 font-semibold">
                                      Verification
                                    </span>
                                    <span className="font-bold text-slate-700">
                                      {inv.confidence != null ? `${inv.confidence.toFixed(1)}% Confidence` : '—'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400 font-semibold">GSTIN</span>
                                    <span className="font-bold text-slate-700">
                                      {inv.vendor_gstin || '—'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <button className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-500 py-2 active:scale-95 transition-all cursor-pointer">
                                    <XCircle className="h-3.5 w-3.5 text-rose-500" />
                                    <span>Hold Payment</span>
                                  </button>
                                  <button className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#3E0856] text-white hover:bg-[#3E0856]/90 text-[10px] font-bold py-2 active:scale-95 transition-all cursor-pointer">
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
      </div>
    </div>
  );
}
