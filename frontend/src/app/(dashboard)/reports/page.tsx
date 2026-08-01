'use client';

import React, { useState } from 'react';
import MonthlyInvoiceChart from '@/components/charts/MonthlyInvoiceChart';
import RiskChart from '@/components/charts/RiskChart';
import VendorChart from '@/components/charts/VendorChart';
import { Download, FileSpreadsheet, Sparkles, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';

export default function ReportsPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: string) => {
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsExporting(false);
    alert(`${type} report exported successfully.`);
  };

  return (
    <div className="space-y-8">
      {/* Header and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">AI Compliance Telemetry Reports</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Analyze historical GST match ratios, duplicate scan reports, and routing risks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('PDF')}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="h-4 w-4 text-[#3E0856]" />
            <span>Generate PDF Audit</span>
          </button>
          <button
            onClick={() => handleExport('CSV')}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export CSV Sheet</span>
          </button>
        </div>
      </div>

      {/* Grid of Telemetry Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Compliance Rate */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reconciliation Rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">94.8%</span>
            <span className="text-xs font-bold text-emerald-600">+1.2% this cycle</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-normal">
            Percentage of invoices successfully reconciled against purchase orders and vendor bank details on the first pass.
          </p>
        </div>

        {/* GST Compliance */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GST Verification Ratio</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">97.1%</span>
            <span className="text-xs font-bold text-rose-600">-0.5% deviations</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-normal">
            Percentage of invoices matching central GST database records. Slight increase in HSN code deviations this month.
          </p>
        </div>

        {/* Payment Security */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Redirect Vulnerability</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">0.0%</span>
            <span className="text-xs font-bold text-emerald-600">0 Fraud events</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-normal">
            We successfully blocked 5 mismatched bank routing events during OCR parsing, preventing redirect account fraud.
          </p>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Processing Volume */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-[#3E0856]" />
              Historical Processing & Flags
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Month-on-month processing volumes vs flagged risk signals</p>
          </div>
          <MonthlyInvoiceChart />
        </div>

        {/* GST and Risk category distribution */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <AlertCircle className="h-4.5 w-4.5 text-[#3E0856]" />
              Compliance Anomalies Distribution
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Breakdown of specific audit criteria triggers</p>
          </div>
          <VendorChart />
        </div>

        {/* Monthly Risk Telemetry */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-2">
              <RefreshCw className="h-4.5 w-4.5 text-[#3E0856]" />
              Risk Engine Dynamic Trend
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Continuous evaluation model logs for processed ledger items</p>
          </div>
          <RiskChart />
        </div>
      </div>
    </div>
  );
}
