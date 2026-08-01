'use client';

import React, { useEffect, useState } from 'react';
import { FileText, AlertTriangle, Clock, Copy, Percent, FileCode } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import { fetchDashboardStats, type DashboardStats } from '@/lib/api';

export const StatsGrid: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(() => { /* silently ignore — page-level toast handles errors */ });
  }, []);

  const s = stats ?? {
    invoices_processed: 0,
    risks_detected: 0,
    pending_review: 0,
    duplicate_invoices: 0,
    gst_errors: 0,
    ledger_mismatches: 0,
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        title="Processed"
        value={s.invoices_processed}
        change=""
        isPositive={true}
        icon={FileText}
        sparklineData={[40, 50, 45, 62, 58, 70, s.invoices_processed]}
      />
      <MetricCard
        title="Risks Detected"
        value={s.risks_detected}
        change=""
        isPositive={false}
        icon={AlertTriangle}
        color="accent"
        sparklineData={[10, 15, 8, 22, 14, 18, s.risks_detected]}
      />
      <MetricCard
        title="Pending Review"
        value={s.pending_review}
        change=""
        isPositive={true}
        icon={Clock}
        sparklineData={[15, 12, 14, 10, 9, 7, s.pending_review]}
      />
      <MetricCard
        title="Duplicates"
        value={s.duplicate_invoices}
        change=""
        isPositive={true}
        icon={Copy}
        sparklineData={[5, 4, 6, 2, 3, 3, s.duplicate_invoices]}
      />
      <MetricCard
        title="GST Errors"
        value={s.gst_errors}
        change=""
        isPositive={false}
        icon={Percent}
        sparklineData={[2, 4, 3, 5, 4, 3, s.gst_errors]}
      />
      <MetricCard
        title="Ledger Misses"
        value={s.ledger_mismatches}
        change=""
        isPositive={true}
        icon={FileCode}
        sparklineData={[12, 10, 11, 8, 9, 6, s.ledger_mismatches]}
      />
    </div>
  );
};

export default StatsGrid;
