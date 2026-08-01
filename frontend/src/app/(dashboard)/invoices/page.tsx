'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter, ArrowUpDown, ArrowRight, Download, FileSpreadsheet } from 'lucide-react';
import { mockInvoices, Invoice } from '@/constants/mockData';
import RiskBadge from '@/components/common/RiskBadge';
import EmptyState from '@/components/common/EmptyState';

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'riskScore'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and Sort logic
  const filteredInvoices = useMemo(() => {
    return mockInvoices
      .filter((inv: Invoice) => {
        const matchesSearch =
          inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.vendorGstin.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
        
        let matchesRisk = true;
        if (riskFilter === 'HIGH') matchesRisk = inv.riskScore >= 75;
        else if (riskFilter === 'MEDIUM') matchesRisk = inv.riskScore >= 30 && inv.riskScore < 75;
        else if (riskFilter === 'LOW') matchesRisk = inv.riskScore < 30;

        return matchesSearch && matchesStatus && matchesRisk;
      })
      .sort((a: Invoice, b: Invoice) => {
        let comparison = 0;
        if (sortBy === 'date') {
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (sortBy === 'amount') {
          comparison = a.amount - b.amount;
        } else if (sortBy === 'riskScore') {
          comparison = a.riskScore - b.riskScore;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [searchTerm, statusFilter, riskFilter, sortBy, sortOrder]);

  const handleSort = (field: 'date' | 'amount' | 'riskScore') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const statusOptions = ['ALL', 'Verified', 'High Risk', 'Pending Review', 'Duplicate', 'GST Mismatch', 'Ledger Missing'];

  return (
    <div className="space-y-8">
      {/* Header action panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Invoice Telemetry Directory</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            View compliance scores, anomaly checks, and OCR verification states.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all">
            <Download className="h-4 w-4 text-[#3E0856]" />
            <span>PDF Summary</span>
          </button>
          <button className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        {/* Search */}
        <div className="relative lg:col-span-5">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number, vendor, GSTIN..."
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
            <option value="ALL">All Compliance Statuses</option>
            {statusOptions.slice(1).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <Filter className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Risk Filter */}
        <div className="relative lg:col-span-2">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none appearance-none transition-all focus:border-[#3E0856] focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High (Score &gt;= 75)</option>
            <option value="MEDIUM">Medium (Score 30-74)</option>
            <option value="LOW">Low (Score &lt; 30)</option>
          </select>
          <Filter className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Clear Filters Button */}
        <button
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('ALL');
            setRiskFilter('ALL');
          }}
          className="lg:col-span-2 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-xs font-bold text-slate-500 py-2.5 transition-colors cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

      {/* Main Table card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        {filteredInvoices.length === 0 ? (
          <EmptyState
            title="No invoices found matching criteria"
            description="Adjust your search tags, verify the filters, or ingest new bills to run scans."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider select-none">
                  <th className="pb-3 pl-2">Invoice No</th>
                  <th className="pb-3">Vendor</th>
                  <th className="pb-3 cursor-pointer hover:text-slate-600" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">
                      <span>Invoice Date</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="pb-3 text-right cursor-pointer hover:text-slate-600" onClick={() => handleSort('amount')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Total Amount</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="pb-3 text-center">Confidence</th>
                  <th className="pb-3 text-center cursor-pointer hover:text-slate-600" onClick={() => handleSort('riskScore')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Risk Score</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {filteredInvoices.map((inv: Invoice) => (
                  <tr key={inv.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 pl-2">
                      <Link 
                        href={`/invoices/${inv.id}`}
                        className="font-bold text-xs text-[#3E0856] hover:underline"
                      >
                        {inv.invoiceNo}
                      </Link>
                    </td>
                    <td className="py-3.5">
                      <div className="flex flex-col">
                        <Link 
                          href={`/vendors/${inv.vendorId}`}
                          className="text-xs font-bold text-slate-700 hover:text-[#3E0856] hover:underline"
                        >
                          {inv.vendorName}
                        </Link>
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight mt-0.5">{inv.vendorGstin}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-xs font-semibold text-slate-500">
                      {new Date(inv.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 text-right text-xs font-bold text-slate-700">
                      ₹{inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="inline-flex items-center justify-center rounded-lg bg-slate-50 border border-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {inv.confidence}%
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className={`inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-xs font-bold ${
                        inv.riskScore >= 75 
                          ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                          : inv.riskScore >= 30 
                          ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {inv.riskScore}%
                      </span>
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <RiskBadge status={inv.status} showIcon={false} />
                        <Link 
                          href={`/invoices/${inv.id}`}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-[#3E0856] rounded hover:bg-slate-100 transition-all duration-200"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
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
