import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Production-ready Button component conforming to Fintech Design System
 * Variants: primary, secondary, outline, danger, ghost, success
 * Sizes: sm, md, lg
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-4 py-2.5 gap-2 h-10',
    lg: 'text-base px-6 py-3.5 gap-2.5 h-12',
  };

  const variantStyles = {
    primary:
      'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30 hover:shadow-blue-900/50 focus-visible:ring-blue-500 active:scale-[0.98]',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/80 hover:border-slate-600 focus-visible:ring-slate-400 active:scale-[0.98]',
    outline:
      'bg-transparent hover:bg-slate-800/60 text-slate-200 border border-slate-700 focus-visible:ring-blue-500 active:scale-[0.98]',
    success:
      'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 focus-visible:ring-emerald-500 active:scale-[0.98]',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/30 focus-visible:ring-rose-500 active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-slate-800/40 text-slate-300 hover:text-white focus-visible:ring-slate-500',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
};
