'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Building2,
  Hash,
  CalendarDays,
  BadgeIndianRupee,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Upload,
  Receipt,
} from 'lucide-react';
import { getLastResult, clearLastResult } from '@/lib/invoiceStore';
import type { UploadResponse, InvoiceFlag } from '@/lib/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null || n === 0) return '—';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function riskColor(level: string) {
  if (level === 'High') return 'text-rose-600 bg-rose-50 border-rose-200';
  if (level === 'Medium') return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-emerald-600 bg-emerald-50 border-emerald-200';
}

function riskBarColor(level: string) {
  if (level === 'High') return 'bg-rose-500';
  if (level === 'Medium') return 'bg-amber-400';
  return 'bg-emerald-500';
}

function severityBadge(severity: InvoiceFlag['severity']) {
  if (severity === 'High')
    return 'bg-rose-50 text-rose-700 border border-rose-200/70 font-bold';
  if (severity === 'Medium')
    return 'bg-amber-50 text-amber-700 border border-amber-200/70 font-semibold';
  return 'bg-slate-50 text-slate-600 border border-slate-200 font-semibold';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-slate-100 last:border-none gap-4">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
        {label}
      </span>
      <span className="text-xs font-bold text-slate-800 text-right break-all">{value || '—'}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultPage() {
  const router = useRouter();
  const [data, setData] = useState<UploadResponse | null>(null);

  useEffect(() => {
    const result = getLastResult();
    if (!result) {
      // No result in store — redirect to upload
      router.replace('/upload');
      return;
    }
    setData(result);
    // Keep in store until next upload (don't clear here so user can refresh)
  }, [router]);

  if (!data) return null;

  const { fields, risk, filename, file_size_kb, extraction_method, page_count } = data;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Invoice Analysis Result</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            AI extraction + compliance checks completed for{' '}
            <span className="text-[#3E0856]">{filename}</span>
          </p>
        </div>
        <button
          onClick={() => {
            clearLastResult();
            router.push('/upload');
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#3E0856] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#3E0856]/90 active:scale-[0.98] transition-all shadow-sm"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Another
        </button>
      </div>

      {/* File meta strip */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'File', val: filename },
          { label: 'Size', val: `${file_size_kb} KB` },
          { label: 'Method', val: extraction_method },
          { label: 'Pages', val: String(page_count) },
        ].map(({ label, val }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-[11px] shadow-sm"
          >
            <span className="font-semibold text-slate-400 uppercase tracking-wider">{label}:</span>
            <span className="font-bold text-slate-700">{val}</span>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── LEFT: Invoice Details Card ─────────────────────────────── */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3E0856]/5 text-[#3E0856] border border-[#3E0856]/10">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Invoice Details</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Extracted by OCR pipeline</p>
            </div>
          </div>

          <FieldRow
            label="Invoice Number"
            value={
              <span className="flex items-center gap-1.5">
                <Hash className="h-3 w-3 text-[#3E0856]" />
                {fields.invoice_number ?? '—'}
              </span>
            }
          />
          <FieldRow
            label="Invoice Date"
            value={
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3 text-[#3E0856]" />
                {fields.date || '—'}
              </span>
            }
          />
          <FieldRow
            label="Vendor Name"
            value={
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3 w-3 text-[#3E0856]" />
                {fields.vendor_name || '—'}
              </span>
            }
          />
          <FieldRow
            label="Vendor GSTIN"
            value={
              <span className="font-mono text-[11px]">
                {fields.vendor_gstin ?? '—'}
              </span>
            }
          />
          {fields.customer_gstin && (
            <FieldRow
              label="Customer GSTIN"
              value={
                <span className="font-mono text-[11px]">{fields.customer_gstin}</span>
              }
            />
          )}
          {fields.place_of_supply && (
            <FieldRow label="Place of Supply" value={fields.place_of_supply} />
          )}

          {/* Amount breakdown */}
          <div className="mt-2 pt-2 space-y-1">
            <FieldRow label="Taxable Amount" value={fmt(fields.taxable_amount)} />
            <FieldRow
              label="Tax Amount"
              value={
                <span className="flex items-center gap-1.5">
                  <BadgeIndianRupee className="h-3 w-3 text-slate-400" />
                  {fields.tax_amount ? fields.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                </span>
              }
            />
          </div>

          {/* Total Amount — prominent */}
          <div className="mt-3 rounded-xl bg-[#3E0856]/5 border border-[#3E0856]/10 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-bold text-[#3E0856] uppercase tracking-wider">Total Amount</span>
            <span className="text-lg font-bold text-[#3E0856]">{fmt(fields.total_amount)}</span>
          </div>
        </div>

        {/* ── RIGHT: Risk Cards ──────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Risk Score Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3E0856]/5 text-[#3E0856] border border-[#3E0856]/10">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Risk Assessment</h3>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Computed from {risk.flag_count} check{risk.flag_count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Risk Score */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/60 p-4 gap-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Risk Score
                </span>
                <span
                  className={`text-3xl font-bold ${
                    risk.risk_level === 'High'
                      ? 'text-rose-600'
                      : risk.risk_level === 'Medium'
                      ? 'text-amber-500'
                      : 'text-emerald-600'
                  }`}
                >
                  {risk.risk_score}
                </span>
                {/* Score bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${riskBarColor(risk.risk_level)}`}
                    style={{ width: `${Math.min(risk.risk_score, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">out of 100</span>
              </div>

              {/* Risk Level */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/60 p-4 gap-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Risk Level
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold ${riskColor(risk.risk_level)}`}
                >
                  {risk.risk_level === 'High' ? (
                    <ShieldAlert className="h-4 w-4" />
                  ) : risk.risk_level === 'Medium' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {risk.risk_level}
                </span>
              </div>

              {/* Confidence */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/60 p-4 gap-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Confidence
                </span>
                <span className="text-3xl font-bold text-[#3E0856]">
                  {risk.confidence.toFixed(1)}
                  <span className="text-base font-semibold text-slate-400">%</span>
                </span>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#3E0856] transition-all duration-700"
                    style={{ width: `${risk.confidence}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  AI confidence score
                </div>
              </div>
            </div>
          </div>

          {/* Exceptions / Flags Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex-1">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3E0856]/5 text-[#3E0856] border border-[#3E0856]/10">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                  Exception List
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">
                  {risk.flag_count === 0
                    ? 'No exceptions detected'
                    : `${risk.flag_count} exception${risk.flag_count !== 1 ? 's' : ''} flagged`}
                </p>
              </div>
            </div>

            {risk.flags.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-emerald-600">
                <ShieldCheck className="h-10 w-10 opacity-60" />
                <span className="text-sm font-bold">All checks passed</span>
                <span className="text-xs text-slate-400 font-medium">No anomalies detected</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pl-2">Check</th>
                      <th className="pb-3 text-center">Severity</th>
                      <th className="pb-3 pr-2">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60">
                    {risk.flags.map((flag, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pl-2">
                          <span className="text-xs font-bold text-slate-700">{flag.check}</span>
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] ${severityBadge(flag.severity)}`}
                          >
                            {flag.severity}
                          </span>
                        </td>
                        <td className="py-3 pr-2">
                          <span className="text-[11px] text-slate-500 leading-relaxed">
                            {flag.detail}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
