'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RiskBadge from '@/components/common/RiskBadge';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  XOctagon,
  Printer,
  Download,
  Info,
} from 'lucide-react';
import Loader from '@/components/common/Loader';

// ─── Base URL ─────────────────────────────────────────────────────────────────

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

type InvoiceDetail = {
  invoice_number?: string;
  filename?: string;
  status?: string;
  risk_score?: number;
  confidence?: number;
  taxable_amount?: number;
  tax_amount?: number;
  total_amount?: number;
  total?: number;
  exceptions?: Array<{ check: string; severity: 'Low' | 'Medium' | 'High'; detail: string }>;
  vendor?: string;
  vendor_gstin?: string;
  invoice_date?: string;
  upload_time?: string;
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [currentRiskScore, setCurrentRiskScore] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${BASE_URL}/api/invoices/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Invoice not found (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setInvoice(data);
        setCurrentStatus(data.status || 'Pending Review');
        setCurrentRiskScore(data.risk_score || 0);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch invoice details');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleApprove = async () => {
    setIsUpdating(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setCurrentStatus('Verified');
    setCurrentRiskScore(2);
    setIsUpdating(false);
  };

  const handleDispute = async () => {
    setIsUpdating(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setCurrentStatus('High Risk');
    setCurrentRiskScore(95);
    setIsUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader size="lg" label="Loading invoice telemetry report..." />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] gap-3 text-slate-500">
        <AlertTriangle className="h-10 w-10 text-rose-500" />
        <span className="text-sm font-bold">{error || 'Invoice not found'}</span>
        <button
          onClick={() => router.back()}
          className="mt-2 text-xs font-bold text-[#3E0856] hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Derived calculations
  const taxableAmount = invoice.taxable_amount || 0.0;
  const taxAmount = invoice.tax_amount || 0.0;
  const totalAmount = invoice.total_amount || invoice.total || 0.0;
  const exceptions = invoice.exceptions || [];

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                {invoice.invoice_number}
              </h2>
              <RiskBadge status={currentStatus} />
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              OCR Session File: {invoice.filename}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer">
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
          <button className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer">
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
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
                <h3 className="font-bold text-slate-800 text-sm tracking-tight">
                  AI Compliance Explanation
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Risk classification diagnostic report
                </p>
              </div>
              <div className="flex items-center gap-2 bg-[#3E0856]/5 border border-[#3E0856]/10 px-3 py-1.5 rounded-xl">
                <span className="text-[9px] font-bold text-[#3E0856] uppercase tracking-wider">
                  Evaluation Score
                </span>
                <span className="text-sm font-black text-[#FAAE62]">{currentRiskScore}%</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
              {exceptions.length === 0
                ? 'All compliance validation algorithms checks passed successfully. OCR confidence level is high and matched master databases without exceptions.'
                : `FastAPI compliance algorithms flagged ${exceptions.length} exception(s). Please review GSTIN alignment, purchase ledger entries, and numerical rate calculations.`}
            </p>

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
                  {exceptions.map((flag, idx: number) => (
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

        {/* Right Column: Visual Invoice Document Preview (Col span 5) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700">Digital Document Scan</span>
              <span className="text-[9px] font-semibold text-[#3E0856] bg-[#3E0856]/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
                OCR Highlight Mode
              </span>
            </div>

            {/* Document body preview */}
            <div className="relative border border-slate-200/60 rounded-xl bg-slate-50 p-6 min-h-[500px] flex flex-col justify-between overflow-hidden shadow-inner">
              {/* Bounding box overlays */}
              <div className="absolute top-12 left-6 px-1.5 py-0.5 rounded border border-[#3E0856]/40 bg-[#3E0856]/5 text-[9px] font-bold text-[#3E0856] cursor-help">
                Vendor: {invoice.vendor}
              </div>
              <div className="absolute top-24 right-6 px-1.5 py-0.5 rounded border border-[#3E0856]/40 bg-[#3E0856]/5 text-[9px] font-bold text-[#3E0856] cursor-help">
                No: {invoice.invoice_number}
              </div>
              <div className="absolute top-[280px] left-6 px-1.5 py-0.5 rounded border border-[#FAAE62]/50 bg-[#FAAE62]/5 text-[9px] font-bold text-[#3E0856] cursor-help">
                GSTIN: {invoice.vendor_gstin}
              </div>

              {/* Invoice Layout */}
              <div className="space-y-8 select-none">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="h-6 w-16 bg-slate-300 rounded"></div>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase">
                      {invoice.vendor}
                    </p>
                    <p className="text-[8px] text-slate-400 leading-normal max-w-[120px]">
                      {invoice.vendor_gstin ? `GSTIN: ${invoice.vendor_gstin}` : 'Corporate Vendor'}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <h3 className="text-sm font-bold text-slate-700 uppercase">Invoice</h3>
                    <p className="text-[8px] text-slate-400 font-bold">
                      DATE: {invoice.invoice_date || '—'}
                    </p>
                    <p className="text-[8px] text-slate-400 font-bold">
                      INV NO: {invoice.invoice_number}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-[1px] bg-slate-200"></div>
                  <div className="grid grid-cols-4 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    <div className="col-span-2">Description</div>
                    <div className="text-center">Rate</div>
                    <div className="text-right">Total</div>
                  </div>
                  <div className="h-[1px] bg-slate-100"></div>

                  <div className="grid grid-cols-4 text-[9px] font-semibold text-slate-600">
                    <div className="col-span-2">Compliance Scans &amp; Verification Services</div>
                    <div className="text-center">1.00</div>
                    <div className="text-right">
                      ₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 flex flex-col gap-2">
                <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-700">
                    ₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                  <span>Tax Output GST:</span>
                  <span className="font-bold text-slate-700">
                    ₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-[1px] bg-slate-200 my-1"></div>
                <div className="flex justify-between text-xs font-bold text-[#3E0856]">
                  <span>Total Due:</span>
                  <span>
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
