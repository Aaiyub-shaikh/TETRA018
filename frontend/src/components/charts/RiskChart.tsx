'use client';

import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { mockMonthlyInvoices } from '@/constants/mockData';
import Loader from '@/components/common/Loader';

export const RiskChart: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center rounded-2xl border border-slate-100 bg-white p-6">
        <Loader size="sm" label="Mounting telemetry..." />
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={mockMonthlyInvoices}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            {/* Primary brand purple gradient */}
            <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3E0856" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#3E0856" stopOpacity={0.01}/>
            </linearGradient>
            {/* Accent orange gradient */}
            <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FAAE62" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#FAAE62" stopOpacity={0.01}/>
            </linearGradient>
          </defs>
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
          <Area 
            type="monotone" 
            dataKey="processed" 
            stroke="#3E0856" 
            strokeWidth={2.5}
            fillOpacity={1} 
            fill="url(#colorProcessed)" 
            name="Processed Invoices"
          />
          <Area 
            type="monotone" 
            dataKey="flagged" 
            stroke="#FAAE62" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorFlagged)" 
            name="Flagged Anomalies"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RiskChart;
