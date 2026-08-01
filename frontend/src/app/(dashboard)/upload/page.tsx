'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

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

export default function UploadPage() {
  const [uploads, setUploads] = useState<UploadItem[]>([
    {
      id: 'up-1',
      name: 'Reliance_Jul2026_Services.pdf',
      size: '2.4 MB',
      progress: 100,
      status: 'completed',
      invoiceNo: 'INV-2026-00128',
      vendor: 'Reliance Industries Ltd.',
      amount: '₹15,40,000.00',
      confidence: 98.4,
    },
    {
      id: 'up-2',
      name: 'L_and_T_sequential_32L.pdf',
      size: '1.8 MB',
      progress: 100,
      status: 'completed',
      invoiceNo: 'INV-2026-00131',
      vendor: 'Larsen & Toubro Ltd.',
      amount: '₹32,00,000.00',
      confidence: 96.8,
    },
  ]);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
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
  };

  const handleFiles = (files: FileList) => {
    // Add files to list and simulate upload
    const fileList = Array.from(files);
    fileList.forEach((file) => {
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      const newUploadId = 'up-' + Date.now() + Math.random().toString(36).substr(2, 5);
      
      const newItem: UploadItem = {
        id: newUploadId,
        name: file.name,
        size: sizeStr,
        progress: 0,
        status: 'uploading',
      };

      setUploads((prev) => [newItem, ...prev]);

      // Simulate extraction progress
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        setUploads((prev) =>
          prev.map((item) => {
            if (item.id === newUploadId) {
              if (currentProgress >= 100) {
                clearInterval(interval);
                return {
                  ...item,
                  progress: 100,
                  status: 'completed',
                  invoiceNo: 'INV-2026-00' + Math.floor(Math.random() * 100 + 135),
                  vendor: ['Mahindra Logistics Ltd.', 'Tata Steel Ltd.', 'Infosys Ltd.'][Math.floor(Math.random() * 3)],
                  amount: '₹' + Math.floor(Math.random() * 500000 + 100000).toLocaleString('en-IN') + '.00',
                  confidence: parseFloat((Math.random() * 5 + 95).toFixed(1)),
                };
              }
              return { ...item, progress: currentProgress };
            }
            return item;
          })
        );
      }, 300);
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Instructions */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Ingest Invoices</h2>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">
          Scan single or multi-page documents to run OCR extraction, GST check, and ledger matching.
        </p>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-[#FAAE62] bg-[#FAAE62]/5 shadow-[0_0_15px_rgba(250,174,98,0.1)]'
            : 'border-slate-200/80 bg-white hover:border-[#3E0856]/40 hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpeg,.jpg"
          onChange={fileChangeHandler}
          className="hidden"
        />

        <div className={`p-4 rounded-full border mb-4 transition-colors duration-300 ${
          isDragActive ? 'bg-[#FAAE62]/20 text-[#3E0856] border-[#FAAE62]/30' : 'bg-slate-50 border-slate-100 text-slate-400'
        }`}>
          <Upload className="h-7 w-7" />
        </div>

        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Drag and drop your invoices here</h3>
        <p className="text-[11px] text-slate-400 font-medium mt-1 leading-normal max-w-sm">
          Supports PDF, PNG, or JPEG formats. Individual documents are scanned instantly by our layout parser.
        </p>
        
        <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1 text-[10px] font-bold text-[#3E0856] mt-4 border border-slate-200/50">
          Or click to browse files
        </span>
      </div>

      {/* Uploading Progress & Recent History */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight mb-5">Ingestion & Processing Queue</h3>
        
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
              {uploads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400 font-medium">
                    No documents uploaded in this session.
                  </td>
                </tr>
              ) : (
                uploads.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#3E0856]/5 text-[#3E0856] border border-[#3E0856]/10 flex items-center justify-center shadow-sm">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 max-w-[200px] truncate">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {item.status === 'completed' && item.invoiceNo ? `Extracted: ${item.invoiceNo} • ${item.vendor}` : 'Ingesting...'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-xs text-slate-500 font-semibold">{item.size}</td>
                    <td className="py-3.5">
                      {item.status === 'uploading' ? (
                        <div className="flex items-center gap-3">
                          {/* Processing animation bar in brand orange */}
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-[#FAAE62] rounded-full transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-bold text-[#3E0856]">{item.progress}%</span>
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
                    <td className="py-3.5 text-center">
                      {item.confidence ? (
                        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          item.confidence >= 95 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          <ShieldCheck className="h-3 w-3" />
                          {item.confidence}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">—</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      {item.status === 'completed' ? (
                        <Link
                          href="/invoices"
                          className="group inline-flex items-center gap-1 text-[11px] font-bold text-[#3E0856] hover:text-[#FAAE62] transition-colors"
                        >
                          <span>Analyze</span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-300 font-semibold">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
