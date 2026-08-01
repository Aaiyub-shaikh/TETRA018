'use client';

import React from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import AuthGuard from '@/components/common/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full bg-transparent">
        {/* Fixed Sidebar */}
        <AppSidebar />

        {/* Main content body */}
        <div className="flex flex-1 flex-col pl-64">
          {/* Fixed Header */}
          <Header />

          {/* Scrollable page content */}
          <main className="flex-1 px-8 pt-24 pb-12 w-full max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
