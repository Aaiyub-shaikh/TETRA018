'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mockVendors, mockInvoices, Vendor, Invoice } from '@/constants/mockData';
import { ArrowLeft, Landmark, MapPin, Percent, FileText, ShieldAlert, Award } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import RiskBadge from '@/components/common/RiskBadge';
import Loader from '@/components/common/Loader';
import Link from 'next/link';

export default function VendorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const vendor = mockVendors.find((v: Vendor) => v.id === id) || mockVendors[0];
  
  // Filter invoices belonging to this vendor
  const vendorInvoices = mockInvoices.filter((inv: Invoice) => inv.vendorId === vendor.id);

  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader label="Opening vendor ledger..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all active:scale-95"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{vendor.name}</h2>
              <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                vendor.status === 'Active' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                {vendor.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              GSTIN Registration: {vendor.gstin}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Vendor Profile & Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Card: Core Details & Visual Timeline (Col span 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3">
              Corporate Master Credentials
            </h3>
            
            <div className="space-y-4 text-xs">
              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[9px] tracking-wider mb-0.5">Corporate Address</span>
                  <p className="text-slate-600 font-medium leading-relaxed">{vendor.address}</p>
                </div>
              </div>

              {/* Bank Route */}
              <div className="flex items-start gap-3">
                <Landmark className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[9px] tracking-wider mb-0.5">Registered Bank Account</span>
                  <p className="text-slate-700 font-bold">{vendor.bankAccount}</p>
                </div>
              </div>

              {/* GST Verification */}
              <div className="flex items-start gap-3">
                <Percent className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[9px] tracking-wider mb-0.5">GST Registration State</span>
                  <p className="text-slate-700 font-semibold">Active Status verified on Central Board of Indirect Taxes API</p>
                </div>
              </div>
            </div>

            {/* Fraud indicators explanation */}
            {vendor.flaggedReasons && vendor.flaggedReasons.length > 0 && (
              <div className="border border-rose-100 bg-rose-50/20 rounded-xl p-4 space-y-2.5">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Compliance Flag Reasons
                </span>
                <ul className="list-disc list-inside text-[11px] text-slate-600 font-medium space-y-1 pl-1">
                  {vendor.flaggedReasons.map((reason: string, idx: number) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-[#3E0856] flex items-center justify-center shrink-0 border border-purple-100">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Invoice</span>
                <p className="text-sm font-bold text-slate-700">₹{vendor.averageAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk Level</span>
                <p className="text-sm font-bold text-slate-700">{vendor.riskLevel}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Fraud Score Chart & Invoice list (Col span 7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Fraud History Line Chart */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">AI Fraud Score Telemetry</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Historical risk scoring progression over the last 5 cycles</p>
            </div>
            
            <div className="h-[220px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={vendor.riskHistory}
                  margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e2ec" opacity={0.6} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e2ec', 
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(62, 8, 86, 0.05)',
                      fontSize: '11px',
                      fontFamily: 'inherit'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3E0856" 
                    strokeWidth={2.5}
                    dot={{ fill: '#FAAE62', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Fraud Likelihood %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight mb-4">Billing Ledger History</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Invoice No</th>
                    <th className="pb-3">Bill Date</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 pr-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                  {vendorInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-slate-400 font-semibold">
                        No transactions recorded for this vendor.
                      </td>
                    </tr>
                  ) : (
                    vendorInvoices.map((inv: Invoice) => (
                      <tr key={inv.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pl-2">
                          <Link 
                            href={`/invoices/${inv.id}`}
                            className="font-bold text-xs text-[#3E0856] hover:underline"
                          >
                            {inv.invoiceNo}
                          </Link>
                        </td>
                        <td className="py-3 text-xs text-slate-500 font-semibold">{inv.date}</td>
                        <td className="py-3 text-right text-xs font-bold text-slate-700">
                          ₹{inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 pr-2 text-right">
                          <RiskBadge status={inv.status} showIcon={false} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
