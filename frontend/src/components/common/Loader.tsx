import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const Loader: React.FC<LoaderProps> = ({ size = 'md', className = '', label }) => {
  const dimensions = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative">
        {/* Core spinner ring */}
        <div
          className={`${dimensions[size]} rounded-full border-t-[#3E0856] border-r-transparent border-b-[#FAAE62]/30 border-l-transparent animate-spin`}
        ></div>
        {/* Ambient background glow ring */}
        <div
          className={`absolute inset-0 ${
            size === 'sm' ? 'h-5 w-5' : size === 'md' ? 'h-8 w-8' : 'h-12 w-12'
          } rounded-full border-2 border-slate-100 -z-10`}
        ></div>
      </div>
      {label && <p className="text-xs font-medium text-slate-500 animate-pulse">{label}</p>}
    </div>
  );
};

export default Loader;
