'use client';

import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

export const Header: React.FC = () => {
  const pathname = usePathname();

  // Get dynamic page title from path
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/upload') return 'Upload Invoice';
    if (pathname === '/invoices') return 'Invoice Listing';
    if (pathname.startsWith('/invoices/')) return 'Invoice Details';
    if (pathname === '/ledger') return 'Ledger Reconciliation';
    if (pathname === '/vendors') return 'Vendor Directory';
    if (pathname.startsWith('/vendors/')) return 'Vendor Profile';
    if (pathname === '/risk') return 'Risk Engine';
    if (pathname === '/reports') return 'Financial Reports';
    if (pathname === '/settings') return 'Account Settings';
    if (pathname === '/audit') return 'Audit Ledger';
    return 'TETRA Risk Scanner';
  };

  return (
    <header className="fixed top-0 right-0 z-10 flex h-16 w-[calc(100%-256px)] items-center justify-between border-b border-slate-200/80 bg-white/70 px-8 backdrop-blur-md">
      {/* Title */}
      <div>
        <h1 className="text-base font-bold text-slate-800 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-5">
        {/* Search Input bar */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoices, vendors..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs outline-none transition-all duration-200 focus:border-[#3E0856] focus:bg-white focus:ring-1 focus:ring-[#3E0856]"
          />
        </div>

        {/* Support */}
        <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
          <HelpCircle className="h-4.5 w-4.5" />
        </button>

        {/* Notifications */}
        <button className="relative rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
          <Bell className="h-4.5 w-4.5" />
          {/* Dynamic unread dot */}
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#FAAE62] ring-2 ring-white"></span>
        </button>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-slate-200"></div>

        {/* User Profile Info */}
        <div className="flex items-center gap-3 select-none">
          <div className="flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-700">Aaiyub J.</span>
            <span className="text-[10px] text-slate-400 font-medium">Compliance Officer</span>
          </div>
          
          {/* Avatar representation */}
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#3E0856] to-[#601980] text-xs font-bold text-white shadow-sm">
            AJ
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
