import React from 'react';

export const Card = ({ children, className = '', hover = false, onClick, ...props }) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-slate-900/80 border border-slate-800/90 overflow-hidden ${
        hover
          ? 'hover:border-slate-700/90 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`p-5 sm:p-6 border-b border-slate-800/60 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-bold text-white tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-xs text-slate-400 mt-1 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`p-5 sm:p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div
    className={`p-4 sm:p-6 bg-slate-950/40 border-t border-slate-800/60 flex items-center justify-between gap-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);
