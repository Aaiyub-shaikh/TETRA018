'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  Cpu, 
  Layers, 
  Scale, 
  FileCheck, 
  Gauge, 
  History, 
  ArrowRight, 
  Play, 
  Sparkles,
  CheckCircle,
  Activity,
  Workflow
} from 'lucide-react';
import Logo from '../components/common/Logo';

export default function LandingPage() {
  const features = [
    {
      title: 'Invoice OCR Extraction',
      description: 'Neural-net layout parser automatically extracts line items, quantities, and metadata from poor PDFs or scans.',
      icon: Cpu,
    },
    {
      title: 'Ledger Reconciliation',
      description: 'Double-entry ledger verification matches invoice lines with approved purchase orders and goods received notes.',
      icon: Scale,
    },
    {
      title: 'GSTIN Validation & Check',
      description: 'Instantly query public APIs to verify active GST registration, vendor HSN mappings, and tax rate accuracy.',
      icon: FileCheck,
    },
    {
      title: 'Duplicate Collision Scan',
      description: 'Contextual similarity detection catches sequential invoice submissions or matching amounts within billing cycles.',
      icon: Layers,
    },
    {
      title: 'AI Risk Profile Scoring',
      description: 'Predictive scoring calculates probability indicators for routing fraud, double-billing, and tax compliance issues.',
      icon: Gauge,
    },
    {
      title: 'Compliance Audit Trail',
      description: 'Every scan, parameter override, and manual approval is locked with cryptographic hash verification.',
      icon: History,
    },
  ];

  const workflowSteps = [
    { id: 1, title: 'Upload Invoice', desc: 'Drag PDFs or image scans into browser console' },
    { id: 2, title: 'AI OCR Extraction', desc: 'LayoutLM engine processes and extracts text data' },
    { id: 3, title: 'Ledger Matching', desc: 'Reconcile totals against purchase order listings' },
    { id: 4, title: 'Risk Verification', desc: 'Deep validation rules flag anomalous metadata' },
    { id: 5, title: 'Dashboard Approval', desc: 'Approve, dispute, or direct payment in one click' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/40 bg-white/70 px-8 backdrop-blur-md">
        <Logo />
        
        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-xs font-semibold text-slate-500 hover:text-[#3E0856] transition-colors">Features</a>
          <a href="#pipeline" className="text-xs font-semibold text-slate-500 hover:text-[#3E0856] transition-colors">Pipeline</a>
          <a href="#faq" className="text-xs font-semibold text-slate-500 hover:text-[#3E0856] transition-colors">FAQ</a>
        </div>

        {/* CTA Button */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-bold text-slate-600 hover:text-[#3E0856] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl bg-[#3E0856] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#3E0856]/90 active:scale-[0.98] transition-all duration-200"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#FAAE62]" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-8 pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#3E0856]/5 px-3 py-1 text-xs font-semibold text-[#3E0856] border border-[#3E0856]/10">
              <Sparkles className="h-3.5 w-3.5 text-[#FAAE62]" />
              <span>Next-Generation Financial Intelligence</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">
              AI-Powered <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3E0856] to-[#601980]">
                Invoice Risk Scanner
              </span>
            </h1>
            
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xl">
              Detect duplicate invoices, GST inconsistencies, ledger mismatches, and compliance anomalies in seconds. Safeguard company capital against payment redirection fraud using automated OCR matching.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl bg-[#FAAE62] px-6 py-3.5 text-xs font-bold text-[#3E0856] shadow-lg shadow-[#FAAE62]/20 hover:brightness-105 active:scale-[0.98] transition-all duration-200"
              >
                <span>Try Instant Demo</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-6 py-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all duration-200"
              >
                <Play className="h-4 w-4 text-[#3E0856] fill-[#3E0856]/10" />
                <span>Watch Walkthrough</span>
              </button>
            </div>
          </div>

          {/* Hero Right: Modern Dashboard Preview Visual */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl border border-slate-200 bg-white/40 p-4 shadow-2xl backdrop-blur-md">
              
              {/* Simulated Scanning laser line */}
              <div className="absolute left-4 right-4 top-1/3 h-[2px] bg-gradient-to-r from-[#FAAE62] to-[#3E0856] opacity-80 animate-pulse shadow-[0_0_12px_#FAAE62] z-10"></div>
              
              {/* Simulated UI Content */}
              <div className="rounded-xl bg-white border border-slate-200/50 p-4 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                    <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                    <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Risk Assessment Report</span>
                </div>

                <div className="space-y-4">
                  {/* Floating Mock Invoice Card */}
                  <div className="relative rounded-xl border border-rose-200/80 bg-rose-50/20 p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="h-9 w-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-sm">
                          PDF
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">INV-2026-00132</p>
                          <p className="text-[10px] text-slate-400 font-medium">Adani Enterprises Ltd.</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100/80 px-2 py-0.5 text-[9px] font-bold text-rose-700">
                        <ShieldAlert className="h-3 w-3" />
                        Critical Risk
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-400 font-medium block">Total Amount</span>
                        <span className="font-bold text-slate-700">₹48,00,000.00</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium block">Fraud Likelihood</span>
                        <span className="font-bold text-rose-600">92% Match</span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic logs output in dashboard preview */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-rose-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"></div>
                      <span>Anomaly detected on Bank account field:</span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 leading-normal pl-3.5">
                      Extracted account PNB-••••2211 does not match approved vendor profile PNB-••••6655. Flagged as vendor payment redirect fraud suspect.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-8 py-20 bg-slate-50 border-t border-b border-slate-200/40">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Advanced Risk Auditing Capability</h2>
            <p className="text-xs text-slate-500 font-medium">
              We replace labor-intensive manual audits with a zero-latency, multi-layered machine intelligence model.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:border-[#3E0856]/20 transition-all duration-300">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3E0856]/5 text-[#3E0856] border border-[#3E0856]/10 mb-4 transition-colors group-hover:bg-[#3E0856] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight">{feat.title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">{feat.description}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Workflow Section */}
      <section className="px-8 py-20">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center justify-center gap-2">
              <Workflow className="h-6 w-6 text-[#3E0856]" />
              Simplified Audit Workflow
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              How Invexa AI processes document verification cycles from upload to authorization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="relative flex flex-col items-center text-center p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3E0856] text-white font-bold text-sm shadow-md mb-4 border-2 border-white ring-4 ring-purple-100">
                  {step.id}
                </div>
                <h3 className="text-xs font-bold text-slate-800">{step.title}</h3>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">{step.desc}</p>
                
                {/* Connecting arrow indicator between items */}
                {index < 4 && (
                  <div className="hidden md:block absolute top-9 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-[1px] bg-dashed bg-slate-300"></div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Architecture Pipeline Preview */}
      <section id="pipeline" className="px-8 py-20 bg-slate-900 text-slate-100 rounded-3xl mx-4 md:mx-8 mb-20 overflow-hidden relative shadow-xl">
        {/* Subtle decorative background gradient */}
        <div className="absolute right-0 top-0 h-64 w-64 bg-[#FAAE62]/5 blur-3xl -z-10"></div>
        <div className="absolute left-0 bottom-0 h-64 w-64 bg-[#3E0856]/20 blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-white/10">
              Technical Pipeline
            </span>
            <h2 className="text-2xl font-bold tracking-tight">AI Diagnostic Pipeline Architecture</h2>
            <p className="text-xs text-slate-400 font-medium">
              Every document is ingested through a structured machine-learning verification suite.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 py-4 overflow-x-auto">
            
            <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-[#FAAE62] uppercase tracking-wider">Input</span>
              <h3 className="font-bold text-sm mt-2 text-white">Invoice Document</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">PDFs, TIFF, PNG, or printed bill receipts.</p>
            </div>

            <div className="flex items-center justify-center text-slate-500 py-2"><ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" /></div>

            <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stage 1</span>
              <h3 className="font-bold text-sm mt-2 text-white">OCR Engine</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">Visual token parser converts image data into raw structured fields.</p>
            </div>

            <div className="flex items-center justify-center text-slate-500 py-2"><ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" /></div>

            <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stage 2</span>
              <h3 className="font-bold text-sm mt-2 text-white">AI Reasoner</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">Cross-reconciliation engine evaluates ledger items and historical pricing.</p>
            </div>

            <div className="flex items-center justify-center text-slate-500 py-2"><ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" /></div>

            <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stage 3</span>
              <h3 className="font-bold text-sm mt-2 text-white">Validation Rules</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">GST portal checks, banking route validations, and duplicate matches.</p>
            </div>

            <div className="flex items-center justify-center text-slate-500 py-2"><ArrowRight className="h-5 w-5 rotate-90 md:rotate-0" /></div>

            <div className="flex-1 rounded-xl border border-[#FAAE62]/30 bg-[#FAAE62]/5 p-4 flex flex-col justify-between shadow-lg shadow-[#FAAE62]/5">
              <span className="text-[10px] font-bold text-[#FAAE62] uppercase tracking-wider">Output</span>
              <h3 className="font-bold text-sm mt-2 text-white">Risk Dashboard</h3>
              <p className="text-[10px] text-slate-300 font-medium mt-1 leading-relaxed">Consolidated confidence score and highlighted anomaly explanation.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-8 py-20 border-t border-slate-200/40 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Trusted by Accounts Teams</h2>
            <p className="text-xs text-slate-500 font-medium">Hear how finance teams prevent double payments and compliance mistakes using Invexa AI.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs text-slate-500 italic leading-relaxed">
                &ldquo;Invexa AI caught a duplicate invoice mismatch worth ₹32 lakhs during our mid-year closing. The layout looked identical to a previous week billing, but sequential number discrepancies were immediately flagged by the AI engine. An invaluable safeguard.&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#3E0856] text-white flex items-center justify-center font-bold text-[10px]">
                  PM
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Priya Mehta</h4>
                  <p className="text-[9px] text-slate-400 font-medium">Head of Finance, Mahindra Logistics</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs text-slate-500 italic leading-relaxed">
                &ldquo;Configuring bank details check saved us from payment routing fraud. A supplier invoice came in with modified IFSC/bank numbers. Invexa AI flagged the anomaly, matching it as a 92% fraudulent redirect risk.&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#FAAE62] text-[#3E0856] flex items-center justify-center font-bold text-[10px]">
                  RN
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Ravi Nair</h4>
                  <p className="text-[9px] text-slate-400 font-medium">Director of Internal Audit, Tata Steel</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="px-8 py-20 border-t border-slate-200/40">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500 font-medium">Answers to key operational and security topics.</p>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-xs font-bold text-slate-800">How long does the AI extraction scan take?</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium mt-1.5">
                On average, the OCR model and rules processing engine complete scans within 3-5 seconds per document. High-resolution multi-page PDF files process in under 8 seconds.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-xs font-bold text-slate-800">Can it connect directly to our ERP system like SAP or Tally?</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium mt-1.5">
                Yes. Invexa AI provides REST API endpoints that hook into ERP workflows. Ledger matches check live data tables to verify Purchase Orders (POs) and vendor bank records.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-xs font-bold text-slate-800">How does the system handle payment redirect fraud?</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium mt-1.5">
                We parse the bank details printed on the invoice document and cross-reference them against approved accounts in the Vendor Master File. If a mismatch is discovered, a high-severity alert is raised, and manual approval is locked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/60 bg-white py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo />
          <p className="text-[10px] font-semibold text-slate-400">
            &copy; 2026 Invexa AI INC. ALL RIGHTS RESERVED. SECURE SOC2 COMPLIANT PLATFORM.
          </p>
          <div className="flex items-center gap-6 text-[10px] font-bold text-slate-500">
            <a href="#" className="hover:text-[#3E0856]">Privacy Policy</a>
            <a href="#" className="hover:text-[#3E0856]">Terms of Service</a>
            <a href="#" className="hover:text-[#3E0856]">Support Desk</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
