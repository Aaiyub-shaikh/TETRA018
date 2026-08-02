'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  fetchProfile,
  updateProfile,
  uploadProfilePhoto,
  changePassword,
  type ProfileData,
} from '@/lib/api';
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Shield,
  Clock,
  FileText,
  AlertTriangle,
  Send,
  Activity,
  Camera,
  Save,
  Lock,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  Hash,
} from 'lucide-react';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastIdCounter = 0;

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'password' | 'activity'>('edit');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    department: '',
    designation: '',
    organization: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProfile();
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        department: data.department || '',
        designation: data.designation || '',
        organization: data.organization || '',
      });
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleProfileUpdate = async () => {
    try {
      setSaving(true);
      const result = await updateProfile(formData);
      addToast('success', result.message || 'Profile updated successfully');
      await loadProfile();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const result = await uploadProfilePhoto(file);
      if (result.success && profile) {
        setProfile({ ...profile, profile_image: result.profile_image });
        addToast('success', 'Profile photo updated');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to upload photo');
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password.length < 8) {
      addToast('error', 'New password must be at least 8 characters');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      addToast('error', 'Passwords do not match');
      return;
    }
    try {
      setSaving(true);
      const result = await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      addToast('success', result.message || 'Password changed successfully');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      addToast('error', err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#3E0856]/20 border-t-[#3E0856] rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-slate-500">Failed to load profile data.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'edit' as const, label: 'Edit Profile', icon: User },
    { id: 'password' as const, label: 'Change Password', icon: Lock },
    { id: 'activity' as const, label: 'Recent Activity', icon: Activity },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 h-fit">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group mb-4">
              {profile.profile_image ? (
                <img
                  src={profile.profile_image}
                  alt={profile.full_name}
                  className="w-24 h-24 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-[#3E0856] flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {getInitials(profile.full_name)}
                  </span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                <Camera className="w-4 h-4 text-[#3E0856]" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <h2 className="text-sm font-bold text-slate-900">{profile.full_name}</h2>
            <p className="text-xs text-slate-500">{profile.email}</p>
            <span
              className={`mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                profile.account_status === 'active'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  profile.account_status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              {profile.account_status}
            </span>
          </div>

          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#3E0856] text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={FileText}
              label="Invoices Scanned"
              value={profile.stats.total_invoices_scanned}
            />
            <StatCard
              icon={AlertTriangle}
              label="High Risk Reviewed"
              value={profile.stats.high_risk_reviewed}
            />
            <StatCard
              icon={FileText}
              label="Reports Generated"
              value={profile.stats.reports_generated}
            />
            <StatCard
              icon={Send}
              label="Emails Sent"
              value={profile.stats.emails_sent}
            />
          </div>

          {activeTab === 'edit' && (
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-6">
                Edit Profile
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3E0856]/20 focus:border-[#3E0856] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3E0856]/20 focus:border-[#3E0856] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Employee ID
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={profile.employee_id}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Department
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3E0856]/20 focus:border-[#3E0856] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Designation
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3E0856]/20 focus:border-[#3E0856] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Organization
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3E0856]/20 focus:border-[#3E0856] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Role
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={profile.role}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Joined
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formatDate(profile.joined_at)}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Last Login
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={formatDate(profile.last_login)}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleProfileUpdate}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3E0856] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#520b75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-6">
                Change Password
              </h3>

              <div className="max-w-md space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.current_password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, current_password: e.target.value })
                      }
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200/80 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3E0856]/20 focus:border-[#3E0856] transition-colors"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, new_password: e.target.value })
                      }
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200/80 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3E0856]/20 focus:border-[#3E0856] transition-colors"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordData.new_password && passwordData.new_password.length < 8 && (
                    <p className="text-[10px] text-rose-500 mt-1">Must be at least 8 characters</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirm_password}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirm_password: e.target.value })
                      }
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200/80 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3E0856]/20 focus:border-[#3E0856] transition-colors"
                      placeholder="Repeat new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordData.confirm_password &&
                    passwordData.new_password !== passwordData.confirm_password && (
                      <p className="text-[10px] text-rose-500 mt-1">Passwords do not match</p>
                    )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handlePasswordChange}
                  disabled={
                    saving ||
                    !passwordData.current_password ||
                    !passwordData.new_password ||
                    !passwordData.confirm_password
                  }
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3E0856] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#520b75] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  Change Password
                </button>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Last Activity
                  </h3>
                  <span className="text-xs text-slate-500">
                    {formatDate(profile.stats.last_activity)}
                  </span>
                </div>
              </div>

              {profile.recent_activity && profile.recent_activity.length > 0 && (
                <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {profile.recent_activity.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#3E0856]/10 flex items-center justify-center shrink-0">
                          <Activity className="w-4 h-4 text-[#3E0856]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {item.description || item.action || JSON.stringify(item)}
                          </p>
                          {item.timestamp && (
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {formatDateShort(item.timestamp)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.recent_invoices && profile.recent_invoices.length > 0 && (
                <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
                    Recent Scanned Invoices
                  </h3>
                  <div className="space-y-3">
                    {profile.recent_invoices.map((inv: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#FAAE62]/15 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-[#FAAE62]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {inv.vendor_name || inv.filename || inv.invoice_number || 'Invoice'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {inv.risk_level && (
                              <span
                                className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  inv.risk_level === 'High'
                                    ? 'bg-rose-50 text-rose-600'
                                    : inv.risk_level === 'Medium'
                                    ? 'bg-amber-50 text-amber-600'
                                    : 'bg-emerald-50 text-emerald-600'
                                }`}
                              >
                                {inv.risk_level}
                              </span>
                            )}
                            {inv.date && (
                              <span className="text-[10px] text-slate-500">
                                {formatDateShort(inv.date || inv.invoice_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.recent_emails && profile.recent_emails.length > 0 && (
                <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
                    Recent Emails
                  </h3>
                  <div className="space-y-3">
                    {profile.recent_emails.map((email: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                          <Send className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {email.subject || email.to || 'Email'}
                          </p>
                          {email.sent_at && (
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {formatDateShort(email.sent_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold border max-w-sm ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-current opacity-50 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-xl bg-[#3E0856]/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#3E0856]" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
    </div>
  );
}
