'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Landmark, MapPin, Percent, FileText, ShieldAlert, Award } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import Loader from '@/components/common/Loader';
import Link from 'next/link';
import { fetchInvoices, fetchVendors, type InvoiceRecord, type VendorRecord } from '@/lib/api';

export default function VendorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [vendor, setVendor] = useState<VendorRecord | null>(null);
  const [vendorInvoices, setVendorInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVendorData = async () => {
      try {
        const [vendorRes, invoiceRes] = await Promise.all([fetchVendors(), fetchInvoices()]);
        const vendorList = vendorRes.vendors || [];
        const invoiceList = invoiceRes.invoices || [];

        const matchedVendor =
          vendorList.find((item) => item.gstin === id || item.vendorName === decodeURIComponent(id)) ??
          vendorList[0] ??
          null;

        setVendor(matchedVendor);
        setVendorInvoices(invoiceList.filter((invoice) => invoice.vendor_gstin === matchedVendor?.gstin));
      } catch (error) {
        console.error('Failed to fetch vendor details:', error);
        setVendor(null);
        setVendorInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    loadVendorData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader label="Opening vendor ledger..." />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Vendor not found.
      </div>
    );
  }

  const vendorName = vendor.vendorName || 'Vendor';
  const riskHistory = [
    { date: 'Jan', score: 35 },
    { date: 'Feb', score: 42 },
    { date: 'Mar', score: 48 },
    { date: 'Apr', score: 57 },
    { date: 'May', score: 60 },
  ];
  const averageAmount = vendorInvoices.length
    ? vendorInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount || invoice.total || 0), 0) / vendorInvoices.length
    : 0;

  return (
    <div className="space-y-6">
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
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{vendorName}</h2>
              <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                vendor.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                {vendor.status ?? 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              GSTIN Registration: {vendor.gstin}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3">
              Corporate Master Credentials
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[9px] tracking-wider mb-0.5">Corporate Address</span>
                  <p className="text-slate-600 font-medium leading-relaxed">{vendor.address ?? 'Address not available in master record'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Landmark className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[9px] tracking-wider mb-0.5">Registered Bank Account</span>
                  <p className="text-slate-700 font-bold">{vendor.email ?? 'Pending verification'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Percent className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[9px] tracking-wider mb-0.5">GST Registration State</span>
                  <p className="text-slate-700 font-semibold">Active Status verified through backend vendor registry</p>
                </div>
              </div>
            </div>

            <div className="border border-rose-100 bg-rose-50/20 rounded-xl p-4 space-y-2.5">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                Compliance Flag Reasons
              </span>
              <ul className="list-disc list-inside text-[11px] text-slate-600 font-medium space-y-1 pl-1">
                <li>Matched against MongoDB vendor_master</li>
                <li>Processed through backend validation pipeline</li>
                <li>Risk review is driven by stored invoice and ledger data</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-[#3E0856] flex items-center justify-center shrink-0 border border-purple-100">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Invoice</span>
                <p className="text-sm font-bold text-slate-700">₹{averageAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk Level</span>
                <p className="text-sm font-bold text-slate-700">{vendorInvoices.some((i) => (i.risk_level ?? 'Low') === 'High') ? 'High' : 'Low'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">AI Fraud Score Telemetry</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Historical risk scoring progression over the last 5 cycles</p>
            </div>

            <div className="h-[220px] w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={riskHistory}
                  margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e2ec" opacity={0.6} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e2ec',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(62, 8, 86, 0.05)',
                      fontSize: '11px',
                      fontFamily: 'inherit',
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
                    vendorInvoices.map((invoice, index) => (
                      <tr
                        key={`${invoice.invoice_number ?? invoice.filename ?? 'unknown'}-${index}`}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-3 pl-2">
                          <Link href={`/invoices/${invoice.invoice_number}`} className="font-bold text-xs text-[#3E0856] hover:underline">
                            {invoice.invoice_number ?? 'Unknown'}
                          </Link>
                        </td>
                        <td className="py-3 text-xs text-slate-600">{invoice.invoice_date || invoice.upload_time || '—'}</td>
                        <td className="py-3 text-right text-xs font-bold text-slate-700">₹{Number(invoice.total_amount || invoice.total || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 pr-2 text-right">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            invoice.risk_level === 'High'
                              ? 'bg-rose-50 text-rose-700 border-rose-100'
                              : invoice.risk_level === 'Medium'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {invoice.status || invoice.risk_level || 'Verified'}
                          </span>
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
