'use client';

import React, { useEffect, useState } from 'react';
import StatsGrid from '@/components/dashboard/StatsGrid';
import RiskChart from '@/components/charts/RiskChart';
import VendorChart from '@/components/charts/VendorChart';
import Timeline from '@/components/common/Timeline';
import RiskBadge from '@/components/common/RiskBadge';
import { FileText, ArrowRight, ShieldAlert, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { fetchInvoices, fetchAuditTrail, type InvoiceRecord, type AuditEvent } from '@/lib/api';
import Loader from '@/components/common/Loader';

export default function DashboardPage() {
  const [flaggedInvoices, setFlaggedInvoices] = useState<InvoiceRecord[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Load recent invoices
        const invRes = await fetchInvoices();
        const allInvs = invRes.invoices || [];
        setTotalCount(allInvs.length);
        const flagged = allInvs.filter((inv) => inv.status !== 'Verified');
        setFlaggedCount(flagged.length);
        setFlaggedInvoices(flagged.slice(0, 4));

        // Load audit logs and map them to Timeline format
        const auditRes = await fetchAuditTrail(5);
        const events = (auditRes.events || []).map((log: any, idx: number) => {
          const invoiceNo = log.extracted_fields?.invoice_number || 'Unknown';
          const riskLevel = log.risk?.risk_level || 'Low';
          const score = log.risk?.risk_score || 0;

          let severity: 'Info' | 'Warning' | 'Critical' = 'Info';
          if (riskLevel === 'High') severity = 'Critical';
          else if (riskLevel === 'Medium') severity = 'Warning';

          let action = 'Invoice Analyzed';
          let details = `OCR extraction completed for ${log.filename}. Confidence: ${(log.risk?.confidence || 100).toFixed(1)}%. Risk score: ${score}%.`;
          if (log.exceptions && log.exceptions.length > 0) {
            action = 'Anomaly Flags Raised';
            details = `Anomaly detected: ${log.exceptions.map((f: any) => f.check).join(', ')} on invoice ${invoiceNo}.`;
          }

          let formattedTime = '';
          try {
            const d = new Date(log.timestamp);
            formattedTime = d.toISOString().replace('T', ' ').substring(0, 19);
          } catch {
            formattedTime = log.timestamp || '';
          }

          return {
            id: `ev-${idx}-${log.timestamp}`,
            timestamp: formattedTime,
            action,
            user: 'AI Engine',
            targetType: 'Invoice',
            targetId: invoiceNo,
            details,
            severity,
          };
        });
        setTimelineEvents(events);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const flagRate = totalCount > 0 ? ((flaggedCount / totalCount) * 100).toFixed(1) : '0.0';

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader size="lg" label="Initializing compliance command center..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#3E0856]/10 bg-gradient-to-r from-[#3E0856] to-[#601980] p-6 text-white shadow-md">
        {/* Subtle grid pattern in banner */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] -z-10"></div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#FAAE62]/10 blur-3xl -z-10"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FAAE62]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#FAAE62] border border-[#FAAE62]/35">
                <Sparkles className="h-3 w-3" />
                AI Model v2.8 Live
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Compliance Command Center</h2>
            <p className="text-xs text-purple-200/90 max-w-xl">
              TETRA Risk Scanner has completed processing for this cycle. We evaluated {totalCount}{' '}
              entries, flagging {flaggedCount} anomalies. Verify mismatches or payment routing
              changes below.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-purple-200 uppercase tracking-wider">
                Flagged Ratio
              </span>
              <span className="text-xl font-bold text-[#FAAE62]">{flagRate}%</span>
            </div>
            <div className="h-8 w-[1px] bg-white/20"></div>
            <div className="flex items-center gap-1 text-emerald-300 font-semibold text-xs">
              <TrendingUp className="h-4 w-4" />
              Live DB Synced
            </div>
          </div>
        </div>
      </div>

      {/* Numerical Stats Metrics Grid */}
      <StatsGrid />

      {/* Telemetry Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Risk Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-tight">
                Risk Detection &amp; Volume Trend
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Monthly processed invoice count vs flagged risk anomalies
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#3E0856]"></span>Processed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#FAAE62]"></span>Flagged
              </span>
            </div>
          </div>
          <RiskChart />
        </div>

        {/* Risk Type Distribution Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-tight">
              Anomalies by Category
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Breakdown of compliance signals triggered
            </p>
          </div>
          <VendorChart />
        </div>
      </div>

      {/* Flagged logs & Audit activity feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Flagged Invoices (Left column - Col span 2) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                  <ShieldAlert className="h-4.5 w-4.5 text-[#3E0856]" />
                  Action Required: Flagged Invoices
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  High confidence anomalies detected by AI pipeline
                </p>
              </div>
              <Link
                href="/risk"
                className="group inline-flex items-center gap-1 text-xs font-bold text-[#3E0856] hover:text-[#FAAE62] transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Invoice No</th>
                    <th className="pb-3">Vendor</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-center">Score</th>
                    <th className="pb-3 pr-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                  {flaggedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-400 font-medium">
                        No flagged invoices found in database.
                      </td>
                    </tr>
                  ) : (
                    flaggedInvoices.map((inv) => (
                      <tr key={inv.invoice_number} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 pl-2">
                          <Link
                            href={`/invoices/${inv.invoice_number}`}
                            className="font-bold text-xs text-[#3E0856] hover:underline"
                          >
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td className="py-3.5">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-700">
                              {inv.vendor}
                            </span>
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight mt-0.5">
                              {inv.vendor_gstin}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 text-right text-xs font-bold text-slate-700">
                          ₹{(inv.total_amount != null ? inv.total_amount : (inv.total != null ? inv.total : 0)).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3.5 text-center">
                          {(() => {
                            const score = inv.risk_score != null ? inv.risk_score : (inv.risk_level === 'High' ? 85 : inv.risk_level === 'Medium' ? 45 : 10);
                            return (
                              <span
                                className={`inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-xs font-bold ${
                                  score >= 75
                                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}
                              >
                                {score}%
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3.5 pr-2 text-right">
                          <RiskBadge status={inv.status as any} showIcon={false} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Audit trail feed (Right column) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-[#3E0856]" />
              Audit &amp; AI Activity
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Chronological system compliance feed
            </p>
          </div>
          {timelineEvents.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">No compliance feed events found.</p>
          ) : (
            <Timeline events={timelineEvents} limit={4} />
          )}
        </div>
      </div>
    </div>
  );
}
