'use client';

import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend
} from 'recharts';
import { mockMonthlyInvoices } from '@/constants/mockData';
import Loader from '@/components/common/Loader';

export const MonthlyInvoiceChart: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center rounded-2xl border border-slate-100 bg-white p-6">
        <Loader size="sm" label="Mounting bar charts..." />
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={mockMonthlyInvoices}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          barGap={6}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e2ec" opacity={0.6} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e2e2ec', 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(62, 8, 86, 0.05)',
              fontSize: '11px',
              fontFamily: 'inherit'
            }}
          />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', fontFamily: 'inherit', fontWeight: 600, paddingBottom: '10px' }}
          />
          <Bar 
            dataKey="processed" 
            fill="#3E0856" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={30} 
            name="Processed Invoices"
          />
          <Bar 
            dataKey="flagged" 
            fill="#FAAE62" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={30} 
            name="Anomalies Flagged"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyInvoiceChart;
