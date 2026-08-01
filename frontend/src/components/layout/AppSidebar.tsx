'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  Users, 
  ShieldAlert, 
  History, 
  BarChart3, 
  Settings, 
  User, 
  LogOut, 
  Upload,
  ScanLine,
  X
} from 'lucide-react';
import Logo from '@/components/common/Logo';

export const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [showIssuesBadge, setShowIssuesBadge] = useState(true);

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Ledger', href: '/ledger', icon: BookOpen },
    { name: 'Vendors', href: '/vendors', icon: Users },
    { name: 'Risk Detection', href: '/risk', icon: ShieldAlert },
    { name: 'Last Result', href: '/result', icon: ScanLine },
    { name: 'Audit Trail', href: '/audit', icon: History },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const bottomItems = [
    { name: 'Profile', href: '/settings?tab=profile', icon: User },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur-md">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-slate-100">
        <Link href="/">
          <Logo />
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
        <div className="mb-4 px-2">
          <Link
            href="/upload"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3E0856] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#3E0856]/90 active:scale-[0.98] transition-all duration-200"
          >
            <Upload className="h-4 w-4 text-[#FAAE62]" />
            <span>Upload Invoice</span>
          </Link>
        </div>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#3E0856]/5 text-[#3E0856] border-l-3 border-[#FAAE62]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 transition-colors duration-200 ${
                  isActive ? 'text-[#3E0856]' : 'text-slate-400 group-hover:text-slate-600'
                }`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Profile, Issues Badge and Logout Actions */}
      <div className="border-t border-slate-100 p-4 space-y-2">
        {bottomItems.map((item) => {
          const isActive = pathname.startsWith('/settings') && pathname.includes('tab=profile');
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-[#3E0856]/5 text-[#3E0856]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4.5 w-4.5 text-slate-400 group-hover:text-slate-600" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Floating Red Issues Pill as shown in screenshot */}
        {showIssuesBadge && (
          <div className="pt-1">
            <button
              onClick={() => router.push('/risk')}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md text-xs font-bold transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-rose-600 font-extrabold text-[10px]">
                  N
                </span>
                <span>11 Issues</span>
              </div>
              <X
                className="h-3.5 w-3.5 text-rose-200 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowIssuesBadge(false);
                }}
              />
            </button>
          </div>
        )}

        <button
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
          }}
          className="group flex w-full items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50/50 transition-all duration-200 cursor-pointer text-left"
        >
          <LogOut className="h-4.5 w-4.5 text-rose-400 group-hover:text-rose-600" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
