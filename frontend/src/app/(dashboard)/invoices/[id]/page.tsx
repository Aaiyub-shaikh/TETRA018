// src/app/(dashboard)/invoices/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
<<<<<<< Updated upstream
import { apiFetch, BASE_URL, InvoiceDetailResponse } from '@/lib/api';
=======
import { apiFetch, BASE_URL, InvoiceDetailResponse, InvoiceRecord } from '@/lib/api';
>>>>>>> Stashed changes
import {
  inv_invoiceNumber,
  inv_vendor,
  inv_gstin,
  inv_date,
  inv_taxAmount,
  inv_totalAmount,
} from '@/lib/api';
import Loader from '@/components/common/Loader';
import EmptyState from '@/components/common/EmptyState';
import RiskBadge from '@/components/common/RiskBadge';

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

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [invoice, setInvoice] = useState<InvoiceDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dlError, setDlError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch<InvoiceDetailResponse>(`/api/invoices/${id}`);
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

  const record = invoice.invoice;
  const invoiceNo = inv_invoiceNumber(record);
  const vendor = inv_vendor(record);
  const gstin = inv_gstin(record);
  const date = inv_date(record);
  const tax = inv_taxAmount(record);
  const total = inv_totalAmount(record);
  const taxable = total - tax;
<<<<<<< Updated upstream
  const confidence = invoice.risk?.confidence;
  const riskScore = invoice.risk?.risk_score;
  const riskLevel = invoice.risk?.risk_level;
=======
  const confidence = invoice.risk.confidence;
  const riskScore = invoice.risk.risk_score;
  const riskLevel = invoice.risk.risk_level;
>>>>>>> Stashed changes
  const exceptions: any[] = invoice.exceptions ?? record.exceptions ?? record.flags ?? [];
  const rawText: string = record.rawText ?? record.raw_text ?? '';
  const geminiAnalysis: string = invoice.gemini_analysis ?? record.gemini_analysis ?? record.aiExplanation ?? '';
  const recommendations: string = invoice.recommendations ?? record.recommendations ?? '';
  const riskSummary: string = invoice.risk_summary ?? record.risk_summary ?? record.summary ?? '';

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

      {dlError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700 font-semibold">
          {dlError}
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

      {/* Gemini Audit Narrative */}
      {(riskSummary || geminiAnalysis || recommendations) && (
        <div className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#3E0856]/10 text-[#3E0856] border border-[#3E0856]/10">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.09 6.26L21 10l-5 3.64L17.18 21 12 17.77 6.82 21 8 13.64 3 10l6.91-0.74L12 3z"/></svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">AI Audit Summary</p>
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Gemini-generated explanation for this invoice</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              {riskSummary ? (
                <p className="text-base font-semibold text-slate-900">{riskSummary}</p>
              ) : (
                <p className="text-base font-semibold text-slate-900">AI audit completed.</p>
              )}

<<<<<<< Updated upstream
              {renderFormattedNarrative(geminiAnalysis)}
=======
              {geminiAnalysis && (
                <p className="mt-4 text-sm leading-7 text-slate-700 whitespace-pre-wrap">{geminiAnalysis}</p>
              )}
>>>>>>> Stashed changes

              {recommendations && (
                <div className="mt-5 rounded-[20px] bg-white p-4 shadow-sm border border-slate-200">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Recommendations</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700 whitespace-pre-wrap">{recommendations}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
