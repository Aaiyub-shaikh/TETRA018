'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if running in browser client environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        // Clear potential partial profile data
        localStorage.removeItem('user');
        router.replace('/login');
      } else {
        setIsAuthenticated(true);
        setLoading(false);
      }
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          {/* Spinner matching purple brand color */}
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#3E0856] border-t-transparent"></div>
          <p className="text-xs font-semibold text-slate-500">Verifying session security...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;
