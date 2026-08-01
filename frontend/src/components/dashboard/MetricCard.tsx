import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: LucideIcon;
  sparklineData?: number[];
  color?: 'primary' | 'accent' | 'default';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  sparklineData = [30, 40, 35, 50, 49, 60, 70, 91],
  color = 'default',
}) => {
  // Generate simple SVG path for sparkline
  const generateSparklinePath = (data: number[]) => {
    if (data.length === 0) return '';
    const width = 100;
    const height = 30;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((val, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height + 2; // offset to fit stroke
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const sparklinePath = generateSparklinePath(sparklineData);

  return (
    <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm premium-shadow-hover overflow-hidden transition-all duration-300">
      {/* Background brand accent blob on hover */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50 group-hover:bg-[#3E0856]/5 transition-all duration-300 -z-10"></div>
      
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">
            {title}
          </span>
          <span className="text-2xl font-bold text-slate-800 tracking-tight">
            {value}
          </span>
        </div>
        
        {/* Metric Icon with dynamic accent bg */}
        <div className={`p-2.5 rounded-xl border transition-all duration-300 ${
          color === 'primary' 
            ? 'bg-[#3E0856] text-white border-[#3E0856]/20' 
            : color === 'accent' 
            ? 'bg-[#FAAE62]/10 text-[#3E0856] border-[#FAAE62]/20' 
            : 'bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-[#3E0856]/10 group-hover:text-[#3E0856] group-hover:border-[#3E0856]/20'
        }`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {/* Trend Indicator */}
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPositive 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' 
              : 'bg-rose-50 text-rose-700 border border-rose-100/50'
          }`}>
            {change}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">vs last month</span>
        </div>

        {/* Inline SVG Sparkline */}
        <div className="w-24 h-8">
          <svg className="w-full h-full" viewBox="0 0 100 35">
            <path
              d={sparklinePath}
              fill="none"
              stroke={isPositive ? '#10b981' : '#f43f5e'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Sparkline Glow Effect */}
            <path
              d={sparklinePath}
              fill="none"
              stroke={isPositive ? '#10b981' : '#f43f5e'}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-15 blur-[2px]"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
