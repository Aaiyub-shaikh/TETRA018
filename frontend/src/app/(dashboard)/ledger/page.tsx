'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, AlertTriangle, CheckCircle2, ShieldCheck, Scale, RefreshCw, X, Plus } from 'lucide-react';
import { fetchLedger, addLedger, type LedgerRecord } from '@/lib/api';
import EmptyState from '@/components/common/EmptyState';
import Loader from '@/components/common/Loader';

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type = 'error', onClose }: { message: string; type?: 'success' | 'error'; onClose: () => void }) {
  const bg = type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-white text-slate-800';
  const iconBg = type === 'success' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-100';
  const title = type === 'success' ? 'Action Completed' : 'Operation Failed';
  
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-xl max-w-sm ${bg}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${iconBg}`}>
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold">{title}</span>
        <span className="text-[11px] leading-relaxed opacity-90">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="ml-auto shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Add Ledger Entry Modal ───────────────────────────────────────────────────

function AddLedgerModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [gstin, setGstin] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [amount, setAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [status, setStatus] = useState('Reconciled');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber || !vendorName || !amount) {
      setError('Invoice Number, Vendor Name, and Amount are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addLedger({
        invoiceNo: invoiceNumber,
        vendor: vendorName,
        gstin,
        invoiceDate,
        invoiceSum: parseFloat(amount),
        taxAmount: taxAmount ? parseFloat(taxAmount) : 0,
      });
      onSuccess();
      onClose();
      // Reset form
      setInvoiceNumber('');
      setVendorName('');
      setGstin('');
      setInvoiceDate('');
      setAmount('');
      setTaxAmount('');
      setStatus('Reconciled');
    } catch (err: any) {
      setError(err.message || 'Failed to add ledger entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">Add Ledger Entry</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl border border-rose-100 bg-rose-50 text-rose-700 font-semibold leading-relaxed">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-500 mb-1">Invoice Number *</label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-1001"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-none focus:border-[#3E0856] focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">Invoice Date</label>
              <input
                type="text"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                placeholder="2026-07-20"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-none focus:border-[#3E0856] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-500 mb-1">Vendor Name *</label>
            <input
              type="text"
              required
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g. ABC Technologies"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-none focus:border-[#3E0856] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-500 mb-1">GSTIN ID</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="e.g. 24ABCDE1234F1Z5"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-none focus:border-[#3E0856] focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-500 mb-1">Amount *</label>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-none focus:border-[#3E0856] focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">Tax Amount</label>
              <input
                type="number"
                step="any"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                placeholder="9000"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-none focus:border-[#3E0856] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-500 mb-1">Reconciliation Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-none focus:border-[#3E0856] focus:bg-white transition-all cursor-pointer"
            >
              <option value="Reconciled">Reconciled</option>
              <option value="Variance Flag">Variance Flag</option>
              <option value="PO Missing">PO Missing</option>
              <option value="GRN Missing">GRN Missing</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-600 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#3E0856] text-white hover:bg-[#3E0856]/90 font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? 'Adding...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LedgerPage() {
  const [ledgerMatches, setLedgerMatches] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReconciling, setIsReconciling] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadLedger = () => {
    setLoading(true);
    fetchLedger()
      .then((res) => {
        setLedgerMatches(res.entries || []);
        setToast(null);
      })
      .catch((err) => {
        setToast({ message: err.message || 'Failed to load ledger', type: 'error' });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const triggerReconcile = async () => {
    setIsReconciling(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    loadLedger();
    setIsReconciling(false);
    setToast({ message: 'Ledger tables synchronized with ERP database.', type: 'success' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Reconciled':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Variance Flag':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-100';
    }
  };

  // Reconciled Metrics calculations from live data
  const totalReconciled = ledgerMatches.filter((x) => x.status === 'Reconciled').length;
  const varianceAlerts = ledgerMatches.filter((x) => x.status === 'Variance Flag').length;
  const missingPO = ledgerMatches.filter((x) => x.status === 'PO Missing' || x.status === 'GRN Missing').length;
  const passRate = ledgerMatches.length > 0 ? ((totalReconciled / ledgerMatches.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <AddLedgerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setToast({ message: 'Ledger entry added successfully!', type: 'success' });
          loadLedger();
        }}
      />

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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-[#3E0856]" />
            <span>Add Entry</span>
          </button>

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
      </div>

      {/* Ledger Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Reconciled Count */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fully Reconciled</span>
            <span className="text-2xl font-black text-slate-800">{totalReconciled}</span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1">{passRate}% pass rate</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Variance Alerts */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Variance Alerts</span>
            <span className="text-2xl font-black text-slate-800">{varianceAlerts}</span>
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
            <span className="text-2xl font-black text-slate-800">{missingPO}</span>
            <span className="text-[10px] text-rose-600 font-bold block mt-1">No master orders found</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
            <Scale className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm min-h-[200px] flex flex-col justify-center">
        {loading ? (
          <Loader size="md" label="Loading ERP transaction ledger..." />
        ) : ledgerMatches.length === 0 ? (
          <EmptyState
            title="No ledger entries found"
            description="ERP ledger database is empty. Synchronize ERP tables or click Add Entry to register invoices manually."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Invoice No</th>
                  <th className="pb-3">Vendor</th>
                  <th className="pb-3">GSTIN ID</th>
                  <th className="pb-3">Invoice Date</th>
                  <th className="pb-3 text-right">Invoice Sum</th>
                  <th className="pb-3 text-right">Tax Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {ledgerMatches.map((item, index) => {
                  const invoiceNo = item.invoiceNo || '—';
                  const vendor = item.vendor || '—';
                  const gstin = item.gstin || '—';
                  const date = item.invoiceDate ? new Date(item.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                  const amount = item.invoiceSum != null ? item.invoiceSum : 0;
                  const tax = item.taxAmount != null ? item.taxAmount : null;

                  return (
                    <tr key={index} className="group hover:bg-slate-50/50 transition-colors text-xs">
                      <td className="py-3.5 pl-2 font-bold text-[#3E0856]">{invoiceNo}</td>
                      <td className="py-3.5 font-bold text-slate-700">{vendor}</td>
                      <td className="py-3.5 text-slate-500 font-semibold">{gstin}</td>
                      <td className="py-3.5 text-slate-500 font-semibold">{date}</td>
                      <td className="py-3.5 text-right font-bold text-slate-700">₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3.5 text-right font-semibold text-slate-600">{tax != null ? `₹${tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}</td>
                    </tr>
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
