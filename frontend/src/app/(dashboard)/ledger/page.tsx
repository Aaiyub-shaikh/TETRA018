'use client';

import React, { useState } from 'react';
import { BookOpen, AlertTriangle, CheckCircle2, ShieldCheck, Scale, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface LedgerMatch {
  id: string;
  invoiceNo: string;
  poNumber: string;
  grnNumber: string;
  vendor: string;
  invoiceTotal: number;
  poTotal: number;
  variance: number;
  status: 'Reconciled' | 'Variance Flag' | 'PO Missing' | 'GRN Missing';
}

export default function LedgerPage() {
  const [ledgerMatches, setLedgerMatches] = useState<LedgerMatch[]>([
    {
      id: 'lm-1',
      invoiceNo: 'INV-2026-00128',
      poNumber: 'PO-2026-9812',
      grnNumber: 'GRN-2026-4432',
      vendor: 'Reliance Industries Ltd.',
      invoiceTotal: 1540000,
      poTotal: 1540000,
      variance: 0,
      status: 'Reconciled',
    },
    {
      id: 'lm-2',
      invoiceNo: 'INV-2026-00129',
      poNumber: 'PO-2026-9045',
      grnNumber: 'GRN-2026-1189',
      vendor: 'Tata Steel Ltd.',
      invoiceTotal: 845000,
      poTotal: 845000,
      variance: 0,
      status: 'Reconciled',
    },
    {
      id: 'lm-3',
      invoiceNo: 'INV-2026-00135',
      poNumber: 'N/A',
      grnNumber: 'N/A',
      vendor: 'Mahindra Logistics Ltd.',
      invoiceTotal: 280000,
      poTotal: 0,
      variance: 280000,
      status: 'PO Missing',
    },
    {
      id: 'lm-4',
      invoiceNo: 'INV-2026-00132',
      poNumber: 'PO-2026-8891',
      grnNumber: 'GRN-2026-0019',
      vendor: 'Adani Enterprises Ltd.',
      invoiceTotal: 4800000,
      poTotal: 4750000,
      variance: 50000,
      status: 'Variance Flag',
    },
  ]);

  const [isReconciling, setIsReconciling] = useState(false);

  const triggerReconcile = async () => {
    setIsReconciling(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsReconciling(false);
    alert('Ledger tables synchronized with ERP master database.');
  };

  const getStatusBadge = (status: LedgerMatch['status']) => {
    switch (status) {
      case 'Reconciled':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Variance Flag':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className="h-5.5 w-5.5 text-[#3E0856]" />
            Double-Entry Ledger Reconciliation
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Cross-reference document totals against Purchase Orders (POs) and Goods Received Notes (GRNs).
          </p>
        </div>

        <button
          onClick={triggerReconcile}
          disabled={isReconciling}
          className="flex items-center gap-1.5 rounded-xl bg-[#3E0856] text-white hover:bg-[#3E0856]/90 px-4 py-2.5 text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isReconciling ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <span>Syncing Ledger...</span>
            </div>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 text-[#FAAE62]" />
              <span>Sync ERP Tables</span>
            </>
          )}
        </button>
      </div>

      {/* Ledger Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Reconciled Count */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fully Reconciled</span>
            <span className="text-2xl font-black text-slate-800">124</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">94.8% pass rate</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Variance Alerts */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Variance Alerts</span>
            <span className="text-2xl font-black text-slate-800">3</span>
            <span className="text-[10px] text-amber-600 font-bold block mt-1">Flagged for review</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        {/* Missing PO Links */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Incomplete PO/GRN</span>
            <span className="text-2xl font-black text-slate-800">7</span>
            <span className="text-[10px] text-rose-600 font-bold block mt-1">No master orders found</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
            <Scale className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight mb-5">Cross-Matching Ledger List</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Invoice No</th>
                <th className="pb-3">Vendor</th>
                <th className="pb-3 text-center">PO Reference</th>
                <th className="pb-3 text-center">GRN Reference</th>
                <th className="pb-3 text-right">Invoice Sum</th>
                <th className="pb-3 text-right">Ledger PO Sum</th>
                <th className="pb-3 text-right">Variance</th>
                <th className="pb-3 pr-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60">
              {ledgerMatches.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors text-xs">
                  <td className="py-3.5 pl-2 font-bold text-[#3E0856]">
                    {item.invoiceNo}
                  </td>
                  <td className="py-3.5 font-bold text-slate-700">{item.vendor}</td>
                  <td className="py-3.5 text-center text-slate-500 font-semibold">{item.poNumber}</td>
                  <td className="py-3.5 text-center text-slate-500 font-semibold">{item.grnNumber}</td>
                  <td className="py-3.5 text-right font-bold text-slate-700">
                    ₹{item.invoiceTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 text-right font-semibold text-slate-600">
                    {item.poTotal > 0 ? `₹${item.poTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className={`py-3.5 text-right font-bold ${item.variance > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                    {item.variance > 0 ? `₹${item.variance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00'}
                  </td>
                  <td className="py-3.5 pr-2 text-right">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
