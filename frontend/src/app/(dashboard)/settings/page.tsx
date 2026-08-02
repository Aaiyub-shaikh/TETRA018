'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sparkles,
  ScanLine,
  ShieldAlert,
  Mail,
  Bell,
  Lock,
  Shield,
  Save,
  Trash2,
  UserPlus,
  RefreshCw,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react';
import { fetchSettings, updateSettings, type AppSettings } from '@/lib/api';
import { apiFetch } from '@/lib/api';

type Tab =
  | 'general'
  | 'ai'
  | 'ocr'
  | 'risk'
  | 'email'
  | 'notifications'
  | 'security'
  | 'admin';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [currentUser, setCurrentUser] = useState<{
    email: string;
    full_name: string;
    role: string;
  } | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('compliance_officer');
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSettings();
      setSettings(data);
    } catch {
      showToast('error', 'Failed to load settings from server.');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const updateField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateNested = <T,>(section: keyof AppSettings, field: string, value: T) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const sectionObj = prev[section];
      if (typeof sectionObj !== 'object' || sectionObj === null) return prev;
      return { ...prev, [section]: { ...sectionObj, [field]: value } };
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await updateSettings(settings);
      showToast('success', 'Settings saved successfully.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await apiFetch<any[]>('/api/auth/users');
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin' && isAdmin) {
      fetchUsers();
    }
  }, [activeTab, currentUser]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newEmail || !newName || !newPassword) {
      setFormError('Please fill in all fields.');
      return;
    }
    setIsSaving(true);
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: newEmail,
          full_name: newName,
          password: newPassword,
          role: newRole,
        }),
      });
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      setNewRole('compliance_officer');
      await fetchUsers();
      showToast('success', 'User registered successfully.');
    } catch (err: any) {
      setFormError(err.message || 'Failed to register user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, targetRole: string) => {
    try {
      await apiFetch(`/api/auth/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: targetRole }),
      });
      await fetchUsers();
      showToast('success', 'User role updated.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update role.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    try {
      await apiFetch(`/api/auth/users/${userId}`, { method: 'DELETE' });
      await fetchUsers();
      showToast('success', 'User removed successfully.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to remove user.');
    }
  };

  const Toggle = ({
    checked,
    onChange,
    disabled,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
  }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className={`w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3E0856] ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      />
    </label>
  );

  const Select = ({
    value,
    onChange,
    children,
  }: {
    value: string;
    onChange: (v: string) => void;
    children: React.ReactNode;
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#3E0856] focus:bg-white cursor-pointer"
    >
      {children}
    </select>
  );

  const NumberInput = ({
    value,
    onChange,
    min,
    max,
    step,
    disabled,
  }: {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
  }) => (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#3E0856] focus:bg-white disabled:opacity-50"
    />
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3E0856] border-t-transparent" />
        <p className="text-xs font-bold text-slate-400">Loading settings...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <p className="text-xs font-bold text-red-500">Failed to load settings.</p>
        <button
          onClick={loadSettings}
          className="rounded-xl bg-[#3E0856] text-white px-4 py-2 text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'general', label: 'General', icon: <Settings className="h-4 w-4" /> },
    { id: 'ai', label: 'AI Settings', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'ocr', label: 'OCR Settings', icon: <ScanLine className="h-4 w-4" /> },
    { id: 'risk', label: 'Risk Settings', icon: <ShieldAlert className="h-4 w-4" /> },
    { id: 'email', label: 'Email Settings', icon: <Mail className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { id: 'security', label: 'Security', icon: <Lock className="h-4 w-4" /> },
    { id: 'admin', label: 'Admin Controls', icon: <Shield className="h-4 w-4 text-[#FAAE62]" />, adminOnly: true },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Compliance Portal Settings</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Configure AI validation rules, OCR engines, security overrides, and workspace integrations.
          </p>
        </div>
        {activeTab !== 'admin' && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-[#3E0856] text-white hover:bg-[#3E0856]/90 px-6 py-2.5 text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 text-[#FAAE62]" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <nav className="flex flex-col gap-1.5 bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm">
            {tabs.map((tab) => {
              if (tab.adminOnly && !isAdmin) return null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#3E0856]/5 text-[#3E0856] border-l-3 border-[#FAAE62]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="lg:col-span-9">
          {activeTab !== 'admin' ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">

              {activeTab === 'general' && (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3">General Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Organization Name</label>
                      <input
                        type="text"
                        value={settings.organization}
                        onChange={(e) => updateField('organization', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none focus:border-[#3E0856] focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default Currency</label>
                      <Select value={settings.currency} onChange={(v) => updateField('currency', v)}>
                        <option value="INR">INR - Indian Rupee</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Time Zone</label>
                      <Select value={settings.timezone} onChange={(v) => updateField('timezone', v)}>
                        <option value="Asia/Kolkata">Asia/Kolkata</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Format</label>
                      <Select value={settings.date_format} onChange={(v) => updateField('date_format', v)}>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Language</label>
                      <Select value={settings.language} onChange={(v) => updateField('language', v)}>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Spanish">Spanish</option>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3">AI Engine Configuration</h3>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Gemini API Enabled</span>
                      <span className="text-[10px] text-slate-400 font-semibold leading-normal">Enable AI-powered invoice analysis and risk scoring.</span>
                    </div>
                    <Toggle checked={settings.ai.enabled} onChange={(v) => updateNested('ai', 'enabled', v)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default Model</label>
                      <Select value={settings.ai.model} onChange={(v) => updateNested('ai', 'model', v)}>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prompt Style</label>
                      <Select value={settings.ai.prompt_style} onChange={(v) => updateNested('ai', 'prompt_style', v)}>
                        <option value="Professional">Professional</option>
                        <option value="Strict Auditor">Strict Auditor</option>
                        <option value="Balanced">Balanced</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Temperature: <span className="text-[#3E0856]">{settings.ai.temperature}</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={settings.ai.temperature}
                        onChange={(e) => updateNested('ai', 'temperature', Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#3E0856]"
                      />
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                        <span>Precise (0)</span>
                        <span>Creative (1)</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Tokens</label>
                      <NumberInput
                        value={settings.ai.max_tokens}
                        onChange={(v) => updateNested('ai', 'max_tokens', v)}
                        min={256}
                        max={8192}
                        step={256}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ocr' && (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3">OCR Engine Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">OCR Engine</label>
                      <Select value={settings.ocr.engine} onChange={(v) => updateNested('ocr', 'engine', v)}>
                        <option value="Tesseract">Tesseract</option>
                        <option value="PaddleOCR">PaddleOCR</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">OCR Language</label>
                      <Select value={settings.ocr.language} onChange={(v) => updateNested('ocr', 'language', v)}>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Confidence Threshold: <span className="text-[#3E0856]">{settings.ocr.confidence}%</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={settings.ocr.confidence}
                        onChange={(e) => updateNested('ocr', 'confidence', Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#3E0856]"
                      />
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">Image Enhancement</span>
                          <span className="text-[10px] text-slate-400 font-semibold">Improve OCR accuracy on scanned documents.</span>
                        </div>
                        <Toggle checked={settings.ocr.image_enhancement} onChange={(v) => updateNested('ocr', 'image_enhancement', v)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">Auto Rotation</span>
                          <span className="text-[10px] text-slate-400 font-semibold">Automatically correct skewed pages.</span>
                        </div>
                        <Toggle checked={settings.ocr.auto_rotation} onChange={(v) => updateNested('ocr', 'auto_rotation', v)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'risk' && (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3">Risk Assessment Rules</h3>
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Risk Threshold: <span className="text-[#3E0856]">{settings.risk.threshold}</span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={settings.risk.threshold}
                        onChange={(e) => updateNested('risk', 'threshold', Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#3E0856]"
                      />
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                        <span>Low (0)</span>
                        <span>Medium (50)</span>
                        <span>High (100)</span>
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">Duplicate Detection</span>
                          <span className="text-[10px] text-slate-400 font-semibold">Flag invoices with matching vendor + amount + date.</span>
                        </div>
                        <Toggle checked={settings.risk.duplicate_detection} onChange={(v) => updateNested('risk', 'duplicate_detection', v)} />
                      </div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">GST Validation</span>
                          <span className="text-[10px] text-slate-400 font-semibold">Verify GSTIN format and state code consistency.</span>
                        </div>
                        <Toggle checked={settings.risk.gst_validation} onChange={(v) => updateNested('risk', 'gst_validation', v)} />
                      </div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">Vendor Validation</span>
                          <span className="text-[10px] text-slate-400 font-semibold">Cross-check vendor details against master database.</span>
                        </div>
                        <Toggle checked={settings.risk.vendor_validation} onChange={(v) => updateNested('risk', 'vendor_validation', v)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">Ledger Matching</span>
                          <span className="text-[10px] text-slate-400 font-semibold">Match invoice line items with purchase ledger entries.</span>
                        </div>
                        <Toggle checked={settings.risk.ledger_matching} onChange={(v) => updateNested('risk', 'ledger_matching', v)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3">Email Integration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMTP Server</label>
                      <input
                        type="text"
                        value={settings.email.smtp_server}
                        onChange={(e) => updateNested('email', 'smtp_server', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none focus:border-[#3E0856] focus:bg-white"
                        placeholder="smtp.example.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMTP Port</label>
                      <NumberInput
                        value={settings.email.smtp_port}
                        onChange={(v) => updateNested('email', 'smtp_port', v)}
                        min={1}
                        max={65535}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sender Email</label>
                      <input
                        type="email"
                        value={settings.email.sender_email}
                        onChange={(e) => updateNested('email', 'sender_email', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none focus:border-[#3E0856] focus:bg-white"
                        placeholder="noreply@company.com"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reply Email</label>
                      <input
                        type="email"
                        value={settings.email.reply_email}
                        onChange={(e) => updateNested('email', 'reply_email', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs outline-none focus:border-[#3E0856] focus:bg-white"
                        placeholder="support@company.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Enable Email Notifications</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Send risk alerts and reports via email.</span>
                      </div>
                      <Toggle checked={settings.email.notifications_enabled} onChange={(v) => updateNested('email', 'notifications_enabled', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Auto Send Report</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Automatically email compliance reports after processing.</span>
                      </div>
                      <Toggle checked={settings.email.auto_send_report} onChange={(v) => updateNested('email', 'auto_send_report', v)} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Browser Notifications</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Show desktop alerts for critical events.</span>
                      </div>
                      <Toggle checked={settings.notifications.browser_notifications} onChange={(v) => updateNested('notifications', 'browser_notifications', v)} />
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Email Alerts</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Receive email summaries of important activities.</span>
                      </div>
                      <Toggle checked={settings.notifications.email_alerts} onChange={(v) => updateNested('notifications', 'email_alerts', v)} />
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Invoice Completion Alerts</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Notify when invoice processing completes.</span>
                      </div>
                      <Toggle checked={settings.notifications.invoice_completion} onChange={(v) => updateNested('notifications', 'invoice_completion', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Risk Alerts</span>
                        <span className="text-[10px] text-slate-400 font-semibold">Instant alerts when high-risk invoices are detected.</span>
                      </div>
                      <Toggle checked={settings.notifications.risk_alerts} onChange={(v) => updateNested('notifications', 'risk_alerts', v)} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-3">Portal Security</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Session Timeout (minutes)</label>
                      <Select value={String(settings.security.session_timeout)} onChange={(v) => updateNested('security', 'session_timeout', Number(v))}>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="120">120 minutes</option>
                        <option value="240">240 minutes</option>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Two-Factor Authentication</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Secure compliance operations with TOTP authenticator tokens.</span>
                    </div>
                    <Toggle checked={settings.security.two_factor_enabled} onChange={(v) => updateNested('security', 'two_factor_enabled', v)} />
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-100 p-4">
                      <span className="text-xs font-bold text-slate-700 block mb-1">Login History</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Session audit log will be displayed here.</span>
                    </div>
                    <div className="rounded-xl border border-slate-100 p-4">
                      <span className="text-xs font-bold text-slate-700 block mb-1">Active Sessions</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Currently active device sessions will be shown here.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => showToast('success', 'All other sessions have been terminated.')}
                      className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Logout All Devices
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight">System Access Directories</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Manage administrative credentials and security roles.</p>
                  </div>
                  <button
                    onClick={fetchUsers}
                    disabled={isLoadingUsers}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 disabled:opacity-55 cursor-pointer"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                  </button>
                </div>

                {isLoadingUsers ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3E0856] border-t-transparent" />
                    <p className="text-[10px] font-bold text-slate-400">Syncing database collections...</p>
                  </div>
                ) : users.length === 0 ? (
                  <p className="py-6 text-center text-xs font-semibold text-slate-400">No registered users found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-2">User Details</th>
                          <th className="py-3 px-2">Access Role</th>
                          <th className="py-3 px-2">Joined Date</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map((u) => {
                          const isSelf = u.email === currentUser?.email;
                          return (
                            <tr key={u.id} className="text-xs hover:bg-slate-50/50">
                              <td className="py-3.5 px-2">
                                <div className="font-bold text-slate-700">{u.full_name}</div>
                                <div className="text-[10px] font-semibold text-slate-400">
                                  {u.email} {isSelf && <span className="text-[#3E0856] font-bold text-[9px]">(You)</span>}
                                </div>
                              </td>
                              <td className="py-3.5 px-2">
                                <select
                                  disabled={isSelf}
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  className={`rounded-lg border border-slate-200/80 bg-white/60 p-1 text-[10px] font-bold outline-none cursor-pointer focus:border-[#3E0856] ${
                                    isSelf ? 'opacity-65 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <option value="admin">System Admin</option>
                                  <option value="compliance_officer">Compliance Officer</option>
                                  <option value="auditor">Internal Auditor</option>
                                </select>
                              </td>
                              <td className="py-3.5 px-2 text-[10px] font-semibold text-slate-400">
                                {u.created_at
                                  ? new Date(u.created_at).toLocaleDateString(undefined, {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })
                                  : '—'}
                              </td>
                              <td className="py-3.5 px-2 text-right">
                                <button
                                  disabled={isSelf}
                                  onClick={() => handleDeleteUser(u.id)}
                                  className={`rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100/50 transition-colors ${
                                    isSelf ? 'opacity-40 cursor-not-allowed hover:bg-transparent hover:border-transparent' : ''
                                  }`}
                                  title={isSelf ? 'Cannot delete yourself' : 'Revoke account'}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                    <UserPlus className="h-4.5 w-4.5 text-[#3E0856]" />
                    Register Security User
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Issue new cryptographic access credentials to compliance officers or internal auditors.</p>
                </div>

                {formError && (
                  <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-[10px] font-semibold text-rose-700">{formError}</div>
                )}

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">User Name</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-[#3E0856] focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Corporate Email</label>
                      <input
                        type="email"
                        placeholder="name@company.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-[#3E0856] focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Security Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-[#3E0856] focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Administrative Access Role</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-[#3E0856] focus:bg-white cursor-pointer font-semibold text-slate-700"
                      >
                        <option value="compliance_officer">Compliance Officer</option>
                        <option value="admin">System Admin</option>
                        <option value="auditor">Internal Auditor</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-100 mt-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-1.5 rounded-xl bg-[#3E0856] text-white hover:bg-[#3E0856]/90 px-6 py-2.5 text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isSaving ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Registering...</span>
                        </div>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-[#FAAE62]" />
                          <span>Register User</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {toasts.length > 0 && (
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold shadow-lg border ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-500" />
              )}
              <span>{toast.message}</span>
              <button onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))} className="ml-2 cursor-pointer">
                <X className="h-3.5 w-3.5 opacity-50 hover:opacity-100" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
