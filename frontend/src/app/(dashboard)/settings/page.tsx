'use client';

import React, { useState } from 'react';
import { User, Bell, Key, ShieldCheck, Save, Clipboard, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'api' | 'security'>('profile');
  const [apiKey, setApiKey] = useState('tetra_sk_live_6f32e92c451b0f81d1e4');
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert('Settings configuration updated successfully.');
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Compliance Portal Settings</h2>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">
          Configure AI validation rules, set security overrides, and retrieve workspace API integration keys.
        </p>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Side: Tabs Selection (Col span 3) */}
        <div className="lg:col-span-3">
          <nav className="flex flex-col gap-1.5 bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#3E0856]/5 text-[#3E0856] border-l-3 border-[#FAAE62]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <User className="h-4 w-4" />
              <span>User Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'notifications'
                  ? 'bg-[#3E0856]/5 text-[#3E0856] border-l-3 border-[#FAAE62]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Risk Alerts</span>
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'api'
                  ? 'bg-[#3E0856]/5 text-[#3E0856] border-l-3 border-[#FAAE62]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Key className="h-4 w-4" />
              <span>API Integrations</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'security'
                  ? 'bg-[#3E0856]/5 text-[#3E0856] border-l-3 border-[#FAAE62]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Portal Security</span>
            </button>
          </nav>
        </div>

        {/* Right Side: Tab Panel Content (Col span 9) */}
        <div className="lg:col-span-9">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Tab 1: Profile */}
              {activeTab === 'profile' && (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3">User Profile</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        defaultValue="Aaiyub J."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none focus:border-[#3E0856] focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Professional Role</label>
                      <input
                        type="text"
                        defaultValue="Compliance Officer"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/30 py-2.5 px-3 text-xs text-slate-400 outline-none cursor-not-allowed"
                        disabled
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Corporate Email</label>
                      <input
                        type="email"
                        defaultValue="compliance@tetra.com"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/30 py-2.5 px-3 text-xs text-slate-400 outline-none cursor-not-allowed"
                        disabled
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department Division</label>
                      <input
                        type="text"
                        defaultValue="Internal Audit & Risk Management"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none focus:border-[#3E0856] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Notifications */}
              {activeTab === 'notifications' && (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3">Risk Trigger Alerts</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 rounded border-slate-200 text-[#3E0856] focus:ring-[#3E0856]" />
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Critical Risk Anomalies</span>
                        <span className="text-[10px] text-slate-400 font-semibold leading-normal">Send instant email alerts to compliance head when fraud score exceeds 80%.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 rounded border-slate-200 text-[#3E0856] focus:ring-[#3E0856]" />
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Bank Account Routing Deviation</span>
                        <span className="text-[10px] text-slate-400 font-semibold leading-normal">Block payment generation and raise audit alarm on ERP if invoice bank detail is unrecognized.</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-200 text-[#3E0856] focus:ring-[#3E0856]" />
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Daily Audit Summaries</span>
                        <span className="text-[10px] text-slate-400 font-semibold leading-normal">Receive end-of-day digest detailing total scans, matching rate, and pending flags.</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 3: API Settings */}
              {activeTab === 'api' && (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3">Integrations & API Tokens</h3>
                  
                  <div className="space-y-4">
                    {/* API Key Display */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Workspace API Token</label>
                      <div className="relative flex">
                        <input
                          type="text"
                          readOnly
                          value={apiKey}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-12 text-xs font-mono text-slate-600 outline-none select-all"
                        />
                        <button
                          type="button"
                          onClick={copyApiKey}
                          className="absolute right-2 top-1.5 p-1 text-slate-400 hover:text-[#3E0856] rounded hover:bg-slate-100/50 transition-colors"
                          title="Copy API Token"
                        >
                          <Clipboard className="h-4.5 w-4.5" />
                        </button>
                      </div>
                      {isCopied && <p className="text-[10px] font-bold text-emerald-600 mt-1">Token copied to clipboard.</p>}
                    </div>

                    {/* Webhook Endpoint */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">FastAPI Webhook URL</label>
                      <input
                        type="url"
                        defaultValue="https://api.tetra-scanner.com/v1/webhooks/risk-flags"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none focus:border-[#3E0856] focus:bg-white"
                        placeholder="https://your-domain.com/webhook"
                      />
                      <span className="text-[10px] text-slate-400 font-semibold block leading-normal">
                        Our engine fires POST payloads here when compliance overrides are authorized or flags are generated.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Security */}
              {activeTab === 'security' && (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3">Portal Security</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Two-Factor Authentication (2FA)</span>
                        <span className="text-[10px] text-slate-400 font-semibold leading-normal">Secure compliance operations with TOTP authenticator tokens.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3E0856]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Strict Bounding Checks</span>
                        <span className="text-[10px] text-slate-400 font-semibold leading-normal">Require matching Goods Received Notes (GRN) on all transactions over ₹5,00,000.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3E0856]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit panel */}
              <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-xl bg-[#3E0856] text-white hover:bg-[#3E0856]/90 px-6 py-2.5 text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <>
                      <Save className="h-4 w-4 text-[#FAAE62]" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
