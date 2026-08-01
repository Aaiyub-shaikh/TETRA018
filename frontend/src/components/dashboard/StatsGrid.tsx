import React from 'react';
import { FileText, AlertTriangle, Clock, Copy, Percent, FileCode } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import { mockDashboardStats } from '@/constants/mockData';

export const StatsGrid: React.FC = () => {
  const stats = mockDashboardStats;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        title="Processed"
        value={stats.invoicesProcessed.value}
        change={stats.invoicesProcessed.change}
        isPositive={stats.invoicesProcessed.isPositive}
        icon={FileText}
        sparklineData={[40, 50, 45, 62, 58, 70, 75]}
      />
      <MetricCard
        title="Risks Detected"
        value={stats.risksDetected.value}
        change={stats.risksDetected.change}
        isPositive={stats.risksDetected.isPositive}
        icon={AlertTriangle}
        color="accent"
        sparklineData={[10, 15, 8, 22, 14, 18, 14]}
      />
      <MetricCard
        title="Pending Review"
        value={stats.pendingReview.value}
        change={stats.pendingReview.change}
        isPositive={stats.pendingReview.isPositive}
        icon={Clock}
        sparklineData={[15, 12, 14, 10, 9, 7, 8]}
      />
      <MetricCard
        title="Duplicates"
        value={stats.duplicateInvoices.value}
        change={stats.duplicateInvoices.change}
        isPositive={stats.duplicateInvoices.isPositive}
        icon={Copy}
        sparklineData={[5, 4, 6, 2, 3, 3, 3]}
      />
      <MetricCard
        title="GST Errors"
        value={stats.gstErrors.value}
        change={stats.gstErrors.change}
        isPositive={stats.gstErrors.isPositive}
        icon={Percent}
        sparklineData={[2, 4, 3, 5, 4, 3, 4]}
      />
      <MetricCard
        title="Ledger Misses"
        value={stats.ledgerMismatches.value}
        change={stats.ledgerMismatches.change}
        isPositive={stats.ledgerMismatches.isPositive}
        icon={FileCode}
        sparklineData={[12, 10, 11, 8, 9, 6, 7]}
      />
    </div>
  );
};

export default StatsGrid;
