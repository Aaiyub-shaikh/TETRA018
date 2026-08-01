'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, AlertTriangle, X, Plus } from 'lucide-react';
import { fetchVendors, addVendor, type VendorRecord } from '@/lib/api';
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

// ─── Add Vendor Modal ─────────────────────────────────────────────────────────

function AddVendorModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [vendorName, setVendorName] = useState('');
  const [gstin, setGstin] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('Active');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !gstin) {
      setError('Vendor Name and GSTIN are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addVendor({
        vendorName,
        gstin,
        email,
        phone,
        address,
        status,
        country: 'India',
      });
      onSuccess();
      onClose();
      // Reset form
      setVendorName('');
      setGstin('');
      setEmail('');
      setPhone('');
      setAddress('');
      setStatus('Active');
    } catch (err: any) {
      setError(err.message || 'Failed to add vendor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">Add New Vendor</h3>
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
            <label className="block font-bold text-slate-500 mb-1">GSTIN ID *</label>
            <input
              type="text"
              required
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="e.g. 24ABCDE1234F1Z5"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-none focus:border-[#3E0856] focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-500 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@company.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-none focus:border-[#3E0856] focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-500 mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-none focus:border-[#3E0856] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-500 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full mailing address"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-none focus:border-[#3E0856] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 outline-none focus:border-[#3E0856] focus:bg-white transition-all cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="Under Investigation">Under Review</option>
              <option value="Flagged">Flagged</option>
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
              {submitting ? 'Creating...' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadVendors = () => {
    setLoading(true);
    fetchVendors()
      .then((res) => {
        setVendors(res.vendors || []);
        setToast(null);
      })
      .catch((err) => {
        setToast({ message: err.message || 'Failed to fetch vendors', type: 'error' });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const name = vendor.vendorName || '';
      const gstin = vendor.gstin || '';
      
      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gstin.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || vendor.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [vendors, searchTerm, statusFilter]);

  const getStatusStyle = (status: string) => {
    if (status === 'Active') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'Under Investigation' || status === 'Under Review')
      return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <AddVendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setToast({ message: 'Vendor added successfully!', type: 'success' });
          loadVendors();
        }}
      />

      {/* Header Info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Vendor Ledger Master</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Audit corporate supplier registrations, verification statuses, and historical fraud scoring logs.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#3E0856] text-white hover:bg-[#3E0856]/90 px-4 py-2.5 text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4 text-[#FAAE62]" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        {/* Search */}
        <div className="relative lg:col-span-7">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor name, GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs outline-none transition-all focus:border-[#3E0856] focus:bg-white focus:ring-1 focus:ring-[#3E0856]"
          />
        </div>

        {/* Status Filter */}
        <div className="relative lg:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none appearance-none transition-all focus:border-[#3E0856] focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under Investigation">Under Review</option>
            <option value="Flagged">Flagged</option>
          </select>
          <Filter className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('ALL');
          }}
          className="lg:col-span-2 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-xs font-bold text-slate-500 py-2.5 transition-colors cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

      {/* Grid of cards & Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm min-h-[200px] flex flex-col justify-center">
        {loading ? (
          <Loader size="md" label="Loading vendor directory..." />
        ) : filteredVendors.length === 0 ? (
          <EmptyState
            title="No vendors matched"
            description="Adjust your search criteria or register a new vendor profile using the button above."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Vendor Name</th>
                  <th className="pb-3">GSTIN ID</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Address</th>
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {filteredVendors.map((vendor, index) => (
                  <tr key={index} className="group hover:bg-slate-50/50 transition-colors text-xs">
                    <td className="py-3.5 pl-2 font-bold text-slate-700">
                      {vendor.vendorName}
                    </td>
                    <td className="py-3.5 text-slate-500 font-semibold">{vendor.gstin}</td>
                    <td className="py-3.5 text-slate-500 font-medium">{vendor.email || '—'}</td>
                    <td className="py-3.5 text-slate-500 font-medium">{vendor.phone || '—'}</td>
                    <td className="py-3.5 text-slate-500 font-medium max-w-xs truncate">{vendor.address || '—'}</td>
                    <td className="py-3.5 pr-2 text-right">
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusStyle(vendor.status)}`}>
                        {vendor.status === 'Under Investigation' ? 'Under Review' : vendor.status}
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
  );
}
