'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { uploadInvoice } from '@/lib/api';
import { setLastResult } from '@/lib/invoiceStore';
import Loader from '@/components/common/Loader';

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-2xl border border-rose-200 bg-white px-4 py-3.5 shadow-xl max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold text-slate-800">Upload Failed</span>
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadItem {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed' | 'idle';
  invoiceNo?: string;
  vendor?: string;
  amount?: string;
  confidence?: number;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const router = useRouter();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 6000);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const fileChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
    // Reset input so the same file can be re-uploaded
    e.target.value = '';
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      // Only process the first file per drop/select to keep UI clean
      const file = files[0];
      if (!file) return;

      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      const newId = 'up-' + Date.now();

      const newItem: UploadItem = {
        id: newId,
        name: file.name,
        size: sizeStr,
        progress: 0,
        status: 'uploading',
      };

      setUploads((prev) => [newItem, ...prev]);
      setIsUploading(true);

      try {
        const result = await uploadInvoice(file, (pct) => {
          setUploads((prev) =>
            prev.map((item) =>
              item.id === newId ? { ...item, progress: pct } : item
            )
          );
        });

        // Mark as completed with extracted data
        setUploads((prev) =>
          prev.map((item) =>
            item.id === newId
              ? {
                  ...item,
                  progress: 100,
                  status: 'completed',
                  invoiceNo: result.fields.invoice_number ?? '—',
                  vendor: result.fields.vendor_name || '—',
                  amount: result.fields.total_amount
                    ? '₹' +
                      result.fields.total_amount.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })
                    : '—',
                  confidence: result.risk.confidence,
                }
              : item
          )
        );

        // Store result and navigate to result page
        setLastResult(result);
        router.push('/result');
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong.';

        setUploads((prev) =>
          prev.map((item) =>
            item.id === newId
              ? { ...item, progress: 0, status: 'failed' }
              : item
          )
        );
        showToast(message);
      } finally {
        setIsUploading(false);
      }
    },
    [router]
  );

  return (
    <>
      {/* Toast notification */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="space-y-8">
        {/* Page Title & Instructions */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Ingest Invoices</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Scan single or multi-page documents to run OCR extraction, GST check, and ledger
            matching.
          </p>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={!isUploading ? handleDrop : undefined}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
            isUploading
              ? 'border-slate-200/60 bg-slate-50/50 cursor-not-allowed opacity-75'
              : isDragActive
              ? 'border-[#FAAE62] bg-[#FAAE62]/5 shadow-[0_0_15px_rgba(250,174,98,0.1)] cursor-pointer'
              : 'border-slate-200/80 bg-white hover:border-[#3E0856]/40 hover:bg-slate-50/50 cursor-pointer'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpeg,.jpg,.tiff,.tif,.bmp,.webp,.csv"
            onChange={fileChangeHandler}
            disabled={isUploading}
            className="hidden"
          />

          {isUploading ? (
            <Loader size="lg" label="Analyzing invoice with AI…" />
          ) : (
            <>
              <div
                className={`p-4 rounded-full border mb-4 transition-colors duration-300 ${
                  isDragActive
                    ? 'bg-[#FAAE62]/20 text-[#3E0856] border-[#FAAE62]/30'
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}
              >
                <Upload className="h-7 w-7" />
              </div>

              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Drag and drop your invoice here
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1 leading-normal max-w-sm">
                Supports PDF, images (PNG, JPEG, TIFF, BMP, WebP), and CSV files. Documents are
                scanned instantly by our layout parser.
              </p>

              <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1 text-[10px] font-bold text-[#3E0856] mt-4 border border-slate-200/50">
                Or click to browse files
              </span>
            </>
          )}
        </div>

        {/* Processing Queue */}
        {uploads.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight mb-5">
              Ingestion &amp; Processing Queue
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Document Name</th>
                    <th className="pb-3">File Size</th>
                    <th className="pb-3 w-1/3">Extraction Progress</th>
                    <th className="pb-3 text-center">Confidence</th>
                    <th className="pb-3 pr-2 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                  {uploads.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                      {/* Document name */}
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-[#3E0856]/5 text-[#3E0856] border border-[#3E0856]/10 flex items-center justify-center shadow-sm">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700 max-w-[200px] truncate">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                              {item.status === 'completed' && item.invoiceNo
                                ? `Extracted: ${item.invoiceNo} • ${item.vendor}`
                                : item.status === 'failed'
                                ? 'Extraction failed'
                                : 'Ingesting…'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* File size */}
                      <td className="py-3.5 text-xs text-slate-500 font-semibold">{item.size}</td>

                      {/* Progress / status */}
                      <td className="py-3.5">
                        {item.status === 'uploading' ? (
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-[#FAAE62] rounded-full transition-all duration-300"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-[#3E0856]">
                              {item.progress}%
                            </span>
                          </div>
                        ) : item.status === 'completed' ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>AI Parsed Successfully</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-rose-600 text-xs font-bold">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Extraction Failed</span>
                          </div>
                        )}
                      </td>

                      {/* Confidence */}
                      <td className="py-3.5 text-center">
                        {item.confidence != null ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                              item.confidence >= 80
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            <ShieldCheck className="h-3 w-3" />
                            {item.confidence.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold">—</span>
                        )}
                      </td>

                      {/* View result link */}
                      <td className="py-3.5 pr-2 text-right">
                        {item.status === 'completed' ? (
                          <button
                            onClick={() => router.push('/result')}
                            className="group inline-flex items-center gap-1 text-[11px] font-bold text-[#3E0856] hover:text-[#FAAE62] transition-colors"
                          >
                            <span>View Result</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300 font-semibold">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
