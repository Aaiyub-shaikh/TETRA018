import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', iconOnly = false }) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Geometric Scanner Logo Icon */}
      <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#3E0856] text-[#FAAE62] font-bold text-lg overflow-hidden shadow-md">
        <span className="relative z-10">T</span>
        {/* Subtle grid pattern in the logo icon */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:6px_6px]"></div>
        {/* Scanning laser glow line */}
        <div className="absolute left-0 top-0 h-[2px] w-full bg-[#FAAE62] opacity-80 animate-pulse shadow-[0_0_8px_#FAAE62]"></div>
      </div>
      
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span className="font-semibold text-base tracking-tight text-[#3E0856]">
            TETRA<span className="font-light text-slate-500">AI</span>
          </span>
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-medium mt-0.5">
            Risk Scanner
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
