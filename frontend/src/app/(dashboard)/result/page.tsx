'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  Mail,
  Loader2,
  Sparkles,
} from 'lucide-react';

import { getLastResult, clearLastResult } from '@/lib/invoiceStore';
import { sendInvoiceReport, chatAboutInvoice, type UploadResponse, type InvoiceFlag, type RiskExplanation, type ChatMessage } from '@/lib/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null || n === 0) return '—';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function riskColor(level: string) {
  if (level === 'High') return 'text-rose-600 bg-rose-50 border-rose-200';
  if (level === 'Medium') return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-emerald-600 bg-emerald-50 bg-emerald-200';
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

function renderFormattedNarrative(text: string) {
  if (!text) return null;
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-3 text-xs text-slate-700 font-medium leading-relaxed bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-purple-100/80 shadow-xs">
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

function SeverityPill({ severity }: { severity: string }) {
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
    <div className="rounded-2xl border border-[#3E0856]/15 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3E0856]/5 text-[#3E0856] border border-[#3E0856]/10">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Risk Explanations</h3>
          <p className="text-[10px] text-slate-400 font-semibold">Detailed breakdown of each detected anomaly</p>
        </div>
      </div>

      <div className="space-y-2">
        {explanations.map((ex, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-800">{ex.type}</span>
                  <SeverityPill severity={ex.severity} />
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
                <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
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

function AIAuditCopilot({ invoiceId }: { invoiceId: string }) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
      const res = await chatAboutInvoice(invoiceId, question.trim());
      const aiMsg: ChatMessage = { role: 'ai', content: res.answer };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      setChatError(e.message || 'Failed to get AI response. Please retry.');
    } finally {
      setChatLoading(false);
    }
  };

  return (
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
                  <Sparkles className="h-3 w-3 text-[#3E0856]/40 group-hover:text-[#3E0856] transition-colors" />
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation History */}
        {chatMessages.length > 0 && (
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
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

        {/* Error */}
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
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultPage() {

  const router = useRouter();
  const [data, setData] = useState<UploadResponse | null>(null);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const result = getLastResult();
    if (!result) {
      router.replace('/upload');
      return;
    }
    setData(result);
  }, [router]);

  if (!data) return null;

  const { fields, risk, filename, file_size_kb, extraction_method, page_count, risk_summary, gemini_analysis, recommendations, ai_summary, ai_explanation, risk_explanations } = data;

  const handleSendReport = async () => {
    if (!email.trim()) {
      setToast({ message: 'Please enter a recipient email address.', type: 'error' });
      return;
    }

    setIsSending(true);
    setToast(null);

    try {
      const response = await sendInvoiceReport(data?.fields?.invoice_number ?? '', email.trim());
      setToast({ message: response.message || 'Report sent successfully.', type: 'success' });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : 'Unable to send report.', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

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

      {toast && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          {toast.message}
        </div>
      )}

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

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3E0856]/5 text-[#3E0856] border border-[#3E0856]/10">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Email Report</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Send the audit report as a PDF to any recipient</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="recipient@example.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#3E0856] focus:bg-white sm:w-72"
            />
            <button
              onClick={handleSendReport}
              disabled={isSending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3E0856] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#3E0856]/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              {isSending ? 'Sending...' : 'Send Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── LEFT COLUMN: Invoice Details + AI Chat ──────────────────────── */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Invoice Details Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-1">
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

          {/* ═══ AI Audit Copilot ═══ */}
          <AIAuditCopilot invoiceId={fields.invoice_number || filename} />
        </div>

        {/* ── RIGHT COLUMN: Risk Analysis ──────────────────────────────── */}
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

          {/* ── LLM Reasoning / Gemini Forensic Narrative Card ────────────── */}
          <div className="rounded-2xl border border-[#3E0856]/15 bg-gradient-to-r from-[#3E0856]/5 via-purple-50/50 to-[#FAAE62]/5 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3E0856] text-[#FAAE62] shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                    Gemini AI Forensic Audit Narrative
                  </h3>
                  <p className="text-[10px] text-purple-700 font-semibold">
                    Automated LLM reasoning &amp; compliance summary
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#3E0856]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#3E0856] border border-[#3E0856]/15">
                Gemini Active
              </span>
            </div>

            {(risk_summary || risk.summary) && (
              <h4 className="text-xs font-bold text-[#3E0856] border-b border-purple-100 pb-2">
                {risk_summary || risk.summary}
              </h4>
            )}

            {renderFormattedNarrative(
              gemini_analysis ||
                risk.ai_explanation ||
                (risk.flags.length > 0
                  ? `FastAPI AI Risk Engine evaluated document ${filename}. Detected ${risk.flag_count} anomaly check flag(s) with an aggregated risk score of ${risk.risk_score}%. Review vendor master records and purchase ledger total match before approving payment authorization.`
                  : `FastAPI AI Risk Engine evaluated document ${filename}. All OCR structural fields matched approved database entries with 100% confidence. No compliance risk detected.`)
            )}

            {recommendations && (
              <div className="rounded-xl border border-purple-100 bg-white/80 backdrop-blur-sm px-4 py-3 shadow-xs mt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-500">Recommendations</p>
                <p className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-wrap">{recommendations}</p>
              </div>
            )}
          </div>

          {/* ═══ Risk Explanations Accordion ═══ */}
          <RiskExplanationAccordion explanations={risk_explanations || []} />

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
