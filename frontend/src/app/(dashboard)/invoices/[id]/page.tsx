// src/app/(dashboard)/invoices/[id]/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  apiFetch,
  BASE_URL,
  InvoiceDetailResponse,
  InvoiceRecord,
  RiskExplanation,
  ChatMessage,
  chatAboutInvoice,
} from '@/lib/api';
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

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    High: 'bg-red-100 text-red-700 border-red-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colors[severity] || colors.Medium}`}>
      {severity}
    </span>
  );
}

function RiskExplanationAccordion({ explanations }: { explanations: RiskExplanation[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!explanations || explanations.length === 0) return null;

  return (
    <div className="space-y-2">
      {explanations.map((ex, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx} className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-800">{ex.type}</span>
                <SeverityBadge severity={ex.severity} />
              </div>
              <svg
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 space-y-3 border-t border-slate-100">
                <div className="pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Reason</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{ex.reason}</p>
                </div>

                {ex.impact && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Impact</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{ex.impact}</p>
                  </div>
                )}

                {ex.evidence && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Evidence</p>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-lg px-3 py-2 font-mono">{ex.evidence}</p>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Recommendation</p>
                  <p className="text-xs text-[#3E0856] font-semibold leading-relaxed">{ex.recommendation}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const SUGGESTION_CHIPS = [
  'Why is this invoice High Risk?',
  'Explain Amount Difference',
  'Should I Approve?',
  'Summarize Invoice',
  'Any GST Issues?',
];

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [invoice, setInvoice] = useState<InvoiceDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dlError, setDlError] = useState<string | null>(null);
  const router = useRouter();

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChat = async (question: string) => {
    if (!question.trim() || chatLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: question.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    setChatError(null);

    try {
      const res = await chatAboutInvoice(id, question.trim());
      const aiMsg: ChatMessage = { role: 'ai', content: res.answer };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      setChatError(e.message || 'Failed to get AI response');
    } finally {
      setChatLoading(false);
    }
  };

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
  const confidence = invoice.risk?.confidence;
  const riskScore = invoice.risk?.risk_score;
  const riskLevel = invoice.risk?.risk_level;
  const exceptions: any[] = invoice.exceptions ?? record.exceptions ?? record.flags ?? [];
  const rawText: string = record.rawText ?? record.raw_text ?? '';
  const geminiAnalysis: string = invoice.gemini_analysis ?? record.gemini_analysis ?? record.aiExplanation ?? '';
  const recommendations: string = invoice.recommendations ?? record.recommendations ?? '';
  const riskSummary: string = invoice.risk_summary ?? record.risk_summary ?? record.summary ?? '';
  const riskExplanations: RiskExplanation[] = invoice.risk_explanations ?? [];

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

      {/* ═══ Risk Explanations Accordion ═══ */}
      <RiskExplanationAccordion explanations={riskExplanations} />

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

              {renderFormattedNarrative(geminiAnalysis)}

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

      {/* ═══ AI Audit Copilot ═══ */}
      <div className="rounded-2xl border border-[#3E0856]/15 bg-gradient-to-br from-white via-purple-50/30 to-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3E0856] to-[#5B1A7A] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8"/><rect x="2" y="2" width="20" height="8" rx="2"/><path d="M12 12v4"/><path d="M8 16h8"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">AI Audit Assistant</h3>
              <p className="text-[10px] text-white/70 font-medium">Powered by Gemini · Invoice-specific analysis</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {/* Suggestion Chips */}
          {chatMessages.length === 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2.5">Quick Questions</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleChat(chip)}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-[#3E0856]/30 hover:bg-[#3E0856]/5 hover:text-[#3E0856] transition-all shadow-xs"
                  >
                    <svg className="h-3 w-3 text-[#3E0856]/40 group-hover:text-[#3E0856] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.09 6.26L21 10l-5 3.64L17.18 21 12 17.77 6.82 21 8 13.64 3 10l6.91-0.74L12 3z"/></svg>
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation History */}
          {chatMessages.length > 0 && (
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto pr-1">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#3E0856]/10 mt-0.5">
                      <svg className="h-3.5 w-3.5 text-[#3E0856]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 8V4H8"/><rect x="2" y="2" width="20" height="8" rx="2"/><path d="M12 12v4"/><path d="M8 16h8"/>
                      </svg>
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                    {msg.role === 'user' && (
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1 text-right">You</p>
                    )}
                    {msg.role === 'ai' && (
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#3E0856] mb-1">AI Assistant</p>
                    )}
                    <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#3E0856] text-white rounded-br-md'
                        : 'bg-slate-100 text-slate-700 rounded-bl-md border border-slate-200/60'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#3E0856] mt-0.5">
                      <span className="text-[10px] font-bold text-white">U</span>
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#3E0856]/10 mt-0.5">
                    <svg className="h-3.5 w-3.5 text-[#3E0856]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 8V4H8"/><rect x="2" y="2" width="20" height="8" rx="2"/><path d="M12 12v4"/><path d="M8 16h8"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#3E0856] mb-1">AI Assistant</p>
                    <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-200/60">
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#3E0856]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#3E0856]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#3E0856]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {chatError && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700 font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span>{chatError}</span>
              </div>
              <button onClick={() => setChatError(null)} className="text-rose-400 hover:text-rose-600 ml-2 shrink-0">✕</button>
            </div>
          )}

          {/* Input Area */}
          <div className="relative">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(chatInput); } }}
              placeholder="Ask anything about this invoice..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-4 pr-24 py-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3E0856]/15 focus:border-[#3E0856]/30 transition-all shadow-xs"
              disabled={chatLoading}
            />
            <button
              onClick={() => handleChat(chatInput)}
              disabled={!chatInput.trim() || chatLoading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-[#3E0856] px-4 py-2 text-[11px] font-bold text-white hover:bg-[#5B1A7A] active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {chatLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking
                </>
              ) : (
                <>
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Ask AI
                </>
              )}
            </button>
          </div>
        </div>
      </div>

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
