// src/app/(dashboard)/invoices/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, BASE_URL } from '@/lib/api';
import {
  InvoiceRecord,
  inv_invoiceNumber,
  inv_vendor,
  inv_gstin,
  inv_date,
  inv_taxAmount,
  inv_totalAmount,
  inv_riskScore,
  inv_confidence,
  inv_riskLevel,
} from '@/lib/api';
import Loader from '@/components/common/Loader';
import EmptyState from '@/components/common/EmptyState';
import RiskBadge from '@/components/common/RiskBadge';

// ─── Base URL ─────────────────────────────────────────────────────────────────

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

function renderFormattedNarrative(text: string) {
  if (!text) return null;
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-3 text-xs text-slate-700 font-medium leading-relaxed bg-gradient-to-r from-purple-50/50 to-indigo-50/30 rounded-xl p-4 border border-purple-100/80 shadow-xs">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              const parts = line.split(/(\*\*.*?\*\*)/g);
              const formattedContent = parts.map((part, partIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={partIdx} className="font-bold text-[#3E0856]">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              });

              if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2 my-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3E0856] mt-1.5 shrink-0" />
                    <span className="flex-1">{formattedContent}</span>
                  </div>
                );
              }

              if (/^\d+\.\s/.test(trimmed)) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1 my-1">
                    <span className="font-bold text-[#3E0856] text-[11px] shrink-0">
                      {trimmed.match(/^\d+\./)?.[0]}
                    </span>
                    <span className="flex-1">{formattedContent}</span>
                  </div>
                );
              }

              return <p key={lIdx}>{formattedContent}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function InvoiceDetailPage() {

  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<any>(null);
export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dlError, setDlError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch<InvoiceRecord>(`/api/invoices/${id}`);
        setInvoice(data);
        setError(null);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch invoice');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePdf = async () => {
    try {
      setDlError(null);
      const res = await fetch(`${BASE_URL}/api/invoices/${id}/report`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || `Server error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${id}_report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setDlError(e.message || 'PDF download failed');
    }
  };

  const handleCsv = async () => {
    try {
      setDlError(null);
      const res = await fetch(`${BASE_URL}/api/invoices/${id}/csv`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || `Server error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${id}_export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setDlError(e.message || 'CSV download failed');
    }
  };

  if (loading) return <Loader size="md" label="Loading invoice..." />;
  if (error) return <EmptyState title="Error" description={error} />;
  if (!invoice) return <EmptyState title="Not found" description="Invoice data is unavailable." />;

  const invoiceNo = inv_invoiceNumber(invoice);
  const vendor = inv_vendor(invoice);
  const gstin = inv_gstin(invoice);
  const date = inv_date(invoice);
  const tax = inv_taxAmount(invoice);
  const total = inv_totalAmount(invoice);
  const taxable = total - tax;
  const confidence = inv_confidence(invoice);
  const riskScore = inv_riskScore(invoice);
  const riskLevel = inv_riskLevel(invoice);
  const exceptions: any[] = invoice.exceptions ?? invoice.flags ?? [];
  const rawText: string = invoice.rawText ?? invoice.raw_text ?? '';

  return (
    <div className="p-6 space-y-6">
      {/* Back + Download row */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-[#3E0856] hover:underline"
        >
          ← Back to Invoices
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePdf}
            className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            ⬇ PDF Report
          </button>
          <button
            onClick={handleCsv}
            className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Diagnostics and Fields (Col span 7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Auditor Overview */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#FAAE62] animate-pulse"></span>
                  Gemini AI Forensic Audit Explanation
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  LLM risk classification &amp; forensic narrative
                </p>
              </div>
              <div className="flex items-center gap-2 bg-[#3E0856]/5 border border-[#3E0856]/10 px-3 py-1.5 rounded-xl">
                <span className="text-[9px] font-bold text-[#3E0856] uppercase tracking-wider">
                  Evaluation Score
                </span>
                <span className="text-sm font-black text-[#FAAE62]">{currentRiskScore}%</span>
              </div>
            </div>

            {invoice.summary && (
              <h4 className="text-xs font-bold text-[#3E0856] border-b border-purple-100 pb-1.5">
                {invoice.summary}
              </h4>
            )}

            {renderFormattedNarrative(
              invoice.ai_explanation ||
                invoice.aiExplanation ||
                (exceptions.length === 0
                  ? 'All compliance validation algorithm checks passed successfully. OCR confidence level is high and matched master databases without exceptions.'
                  : `FastAPI compliance algorithms flagged ${exceptions.length} exception(s). Please review GSTIN alignment, purchase ledger entries, and numerical rate calculations.`)
            )}



            {/* Confidence Ratings */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="border border-slate-100 bg-slate-50/50 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  OCR Confidence
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base font-bold text-slate-700">
                    {(invoice.confidence || 0).toFixed(1)}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">High Confidence</span>
                </div>
              </div>

              <div className="border border-slate-100 bg-slate-50/50 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Ledger Match
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base font-bold text-slate-700">
                    {invoice.status === 'Ledger Missing' ? 'No PO Match' : 'PO Verified'}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      invoice.status === 'Ledger Missing' ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {invoice.status === 'Ledger Missing' ? 'Incomplete' : 'Matched'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Fields Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight mb-4">
              Extracted Ledger Data
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3.5">
                <div className="flex justify-between pb-2 border-b border-slate-100/60">
                  <span className="font-semibold text-slate-400">Invoice Number</span>
                  <span className="font-bold text-slate-700">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100/60">
                  <span className="font-semibold text-slate-400">Vendor Entity</span>
                  <span className="font-bold text-slate-700">{invoice.vendor}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100/60">
                  <span className="font-semibold text-slate-400">Vendor GSTIN</span>
                  <span className="font-bold text-slate-700">{invoice.vendor_gstin || '—'}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100/60">
                  <span className="font-semibold text-slate-400">File Ingestion Time</span>
                  <span className="font-bold text-slate-700">
                    {invoice.upload_time
                      ? new Date(invoice.upload_time).toLocaleString('en-IN')
                      : '—'}
                  </span>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex justify-between pb-2 border-b border-slate-100/60">
                  <span className="font-semibold text-slate-400">Invoice Date</span>
                  <span className="font-bold text-slate-700">{invoice.invoice_date || '—'}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100/60">
                  <span className="font-semibold text-slate-400">Taxable Amount</span>
                  <span className="font-bold text-slate-700">
                    ₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100/60">
                  <span className="font-semibold text-slate-400">Tax Output (GST)</span>
                  <span className="font-bold text-slate-700">
                    ₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100/60">
                  <span className="font-semibold text-slate-400">Grand Total</span>
                  <span className="font-bold text-[#3E0856]">
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Exception List Section */}
            {exceptions.length > 0 && (
              <div className="mt-5 border border-rose-100 bg-rose-50/20 rounded-xl p-4 space-y-2.5">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Flags &amp; Mismatches Detected
                </span>

                <div className="space-y-2">
                  {exceptions.map((flag: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-600">{flag.check}</span>
                      <span className="text-slate-500 font-medium text-right max-w-xs">{flag.detail}</span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          flag.severity === 'High'
                            ? 'bg-rose-100 text-rose-700'
                            : flag.severity === 'Medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {flag.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons controls */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-700 text-xs">Compliance Audit Actions</h4>
              <p className="text-[10px] text-slate-400 font-medium">
                Verify or override AI flagged risk score
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDispute}
                disabled={isUpdating}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 px-4 py-2.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <XOctagon className="h-4 w-4" />
                <span>Flag Dispute</span>
              </button>
              <button
                onClick={handleApprove}
                disabled={isUpdating}
                className="flex items-center gap-1.5 rounded-xl bg-[#3E0856] text-white hover:bg-[#3E0856]/90 px-5 py-2.5 text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <UserCheck className="h-4 w-4 text-[#FAAE62]" />
                <span>Approve &amp; Verify</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-slate-800">Invoice Details</h2>

      {/* Core details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        {[
          { label: 'Invoice No', value: invoiceNo },
          { label: 'Vendor', value: vendor },
          { label: 'GSTIN', value: gstin },
          { label: 'Invoice Date', value: date || '—' },
          { label: 'Taxable Amount', value: `₹${taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
          { label: 'Tax Amount', value: `₹${tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
          { label: 'Total Amount', value: `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
          { label: 'Confidence', value: confidence != null ? `${confidence.toFixed(1)}%` : '—' },
          { label: 'Risk Score', value: `${riskScore}%` },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
            <p className="text-base font-bold text-slate-800 mt-0.5">{value}</p>
          </div>
        ))}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Risk Level</p>
          <div className="mt-1"><RiskBadge status={riskLevel as any} /></div>
        </div>
      </div>

      {/* Exceptions / Flags */}
      {exceptions.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-amber-800 mb-3 uppercase tracking-wide">Exception Flags</h3>
          <ul className="space-y-1.5">
            {exceptions.map((ex: any, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                <span className="font-bold shrink-0">[{ex.severity ?? ex.check ?? '?'}]</span>
                <span>{ex.detail ?? ex.check ?? JSON.stringify(ex)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw OCR Text */}
      {rawText && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide">Raw OCR Text</h3>
          <pre className="bg-slate-50 p-3 rounded-xl overflow-auto text-xs whitespace-pre-wrap text-slate-700 max-h-64">
            {rawText}
          </pre>
        </div>
      )}
    </div>
  );
}
