import React, { useState } from 'react';
import { Eye, EyeOff, Search, AlertCircle } from 'lucide-react';

/**
 * Production Input component supporting text, password, search, and numeric inputs
 */
export const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  icon: Icon,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`space-y-1.5 w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        {type === 'search' && !Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
        )}

        <input
          type={effectiveType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full rounded-xl bg-slate-900/80 border text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-150 focus:outline-none focus:ring-2 disabled:bg-slate-900/40 disabled:cursor-not-allowed ${
            Icon || type === 'search' ? 'pl-10' : 'pl-3.5'
          } ${isPassword ? 'pr-11' : 'pr-3.5'} py-2.5 ${
            error
              ? 'border-rose-500/80 focus:ring-rose-500/50 bg-rose-950/10'
              : 'border-slate-700/80 hover:border-slate-600 focus:border-blue-500 focus:ring-blue-500/30'
          }`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error ? (
        <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};
