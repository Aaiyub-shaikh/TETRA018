import React from 'react';
import { ShieldCheck, AlertOctagon, RefreshCw, Copy, Percent, AlertTriangle } from 'lucide-react';

export type RiskStatus = 'Verified' | 'High Risk' | 'Pending Review' | 'Duplicate' | 'GST Mismatch' | 'Ledger Missing';

interface RiskBadgeProps {
  status: RiskStatus;
  showIcon?: boolean;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ status, showIcon = true, className = '' }) => {
  const config = {
    'Verified': {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
      icon: ShieldCheck,
      label: 'Verified',
    },
    'High Risk': {
      bg: 'bg-[#FAAE62]/15 text-[#3E0856] border-[#FAAE62]/40 font-semibold shadow-[0_0_10px_rgba(250,174,98,0.08)]',
      icon: AlertOctagon,
      label: 'High Risk',
    },
    'Pending Review': {
      bg: 'bg-amber-50 text-amber-700 border-amber-200/60',
      icon: RefreshCw,
      label: 'Pending Review',
    },
    'Duplicate': {
      bg: 'bg-rose-50 text-rose-700 border-rose-200/60',
      icon: Copy,
      label: 'Duplicate',
    },
    'GST Mismatch': {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
      icon: Percent,
      label: 'GST Mismatch',
    },
    'Ledger Missing': {
      bg: 'bg-violet-50 text-violet-700 border-violet-200/60',
      icon: AlertTriangle,
      label: 'Ledger Missing',
    },
  };

  const current = config[status] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: AlertTriangle,
    label: status,
  };

  const IconComponent = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${current.bg} ${className}`}
    >
      {showIcon && <IconComponent className="h-3.5 w-3.5" />}
      {current.label}
    </span>
  );
};

export default RiskBadge;
