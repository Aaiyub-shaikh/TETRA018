'use client';

import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip,
  Legend
} from 'recharts';
import { fetchDashboardAnomalies } from '@/lib/api';
import Loader from '@/components/common/Loader';

export const VendorChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchDashboardAnomalies()
      .then((res) => {
        setData(res || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch anomalies breakdown:', err);
        setLoading(false);
      });
  }, []);

  if (!isMounted || loading) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center rounded-2xl border border-slate-100 bg-white p-6">
        <Loader size="sm" label="Mounting pie charts..." />
      </div>
    );
  }

  // Curated color palette featuring our primary deep purple (#3E0856) and accent orange (#FAAE62)
  const COLORS = ['#3E0856', '#FAAE62', '#8b5cf6', '#fda4af', '#06b6d4', '#e11d48'];

  // Filter categories with count > 0 to make chart clean, or keep all
  const filteredData = data.filter(d => d.value > 0);
  const chartData = filteredData.length > 0 ? filteredData : [{ name: 'No anomalies', value: 1 }];

  return (
    <div className="h-[300px] w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
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
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', fontFamily: 'inherit', fontWeight: 600 }}
          />
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VendorChart;
