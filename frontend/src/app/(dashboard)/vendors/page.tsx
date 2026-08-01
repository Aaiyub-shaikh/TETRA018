'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter, ShieldAlert, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { mockVendors, Vendor } from '@/constants/mockData';
import EmptyState from '@/components/common/EmptyState';

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredVendors = useMemo(() => {
    return mockVendors.filter((vendor: Vendor) => {
      const matchesSearch =
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.gstin.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRisk = riskFilter === 'ALL' || vendor.riskLevel === riskFilter;
      const matchesStatus = statusFilter === 'ALL' || vendor.status === statusFilter;

      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [searchTerm, riskFilter, statusFilter]);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Vendor Ledger Master</h2>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">
          Audit corporate supplier registrations, verification statuses, and historical fraud scoring logs.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        {/* Search */}
        <div className="relative lg:col-span-5">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor name, GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs outline-none transition-all focus:border-[#3E0856] focus:bg-white focus:ring-1 focus:ring-[#3E0856]"
          />
        </div>

        {/* Risk Level Filter */}
        <div className="relative lg:col-span-3">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none appearance-none transition-all focus:border-[#3E0856] focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>
          <Filter className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative lg:col-span-2">
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
            setRiskFilter('ALL');
            setStatusFilter('ALL');
          }}
          className="lg:col-span-2 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 text-xs font-bold text-slate-500 py-2.5 transition-colors cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

      {/* Grid of cards & Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        {filteredVendors.length === 0 ? (
          <EmptyState
            title="No vendors matched"
            description="Adjust your search criteria or register a new vendor profile in settings."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Vendor Name</th>
                  <th className="pb-3">GSTIN ID</th>
                  <th className="pb-3 text-center">Invoice Volume</th>
                  <th className="pb-3 text-right">Average Invoiced</th>
                  <th className="pb-3 text-center">Fraud Likelihood</th>
                  <th className="pb-3 text-center">Compliance Status</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {filteredVendors.map((vendor: Vendor) => {
                  const getStatusStyle = (status: string) => {
                    if (status === 'Active') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    if (status === 'Under Investigation') return 'bg-amber-50 text-amber-700 border-amber-100';
                    return 'bg-rose-50 text-rose-700 border-rose-100';
                  };

                  return (
                    <tr key={vendor.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pl-2 font-bold text-xs text-slate-700">
                        <Link 
                          href={`/vendors/${vendor.id}`}
                          className="hover:text-[#3E0856] hover:underline"
                        >
                          {vendor.name}
                        </Link>
                      </td>
                      <td className="py-3.5 text-xs text-slate-500 font-semibold">{vendor.gstin}</td>
                      <td className="py-3.5 text-center text-xs font-bold text-slate-600">{vendor.invoiceCount}</td>
                      <td className="py-3.5 text-right text-xs font-bold text-slate-700">
                        ₹{vendor.averageAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Progress indicator */}
                          <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                vendor.fraudScore >= 60 
                                  ? 'bg-rose-500' 
                                  : vendor.fraudScore >= 20 
                                  ? 'bg-amber-500' 
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${vendor.fraudScore}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-bold ${
                            vendor.fraudScore >= 60 
                              ? 'text-rose-600' 
                              : vendor.fraudScore >= 20 
                              ? 'text-amber-600' 
                              : 'text-emerald-600'
                          }`}>
                            {vendor.fraudScore}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusStyle(vendor.status)}`}>
                          {vendor.status === 'Under Investigation' ? 'Under Review' : vendor.status}
                        </span>
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <Link
                          href={`/vendors/${vendor.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3E0856] hover:text-[#FAAE62] transition-colors"
                        >
                          <span>Profile</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
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
