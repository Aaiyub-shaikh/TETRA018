import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', iconOnly = false }) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <img
        src="/invexaai.jpeg"
        alt="Invexa AI"
        className="h-9 w-9 rounded-lg object-cover shadow-md"
      />
      
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span className="font-semibold text-base tracking-tight text-[#3E0856]">
            Invexa<span className="font-light text-slate-500">AI</span>
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
