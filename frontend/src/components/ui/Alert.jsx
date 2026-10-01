import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const Alert = ({ variant = 'info', title, children, onClose, className = '' }) => {
  const configs = {
    info: {
      bg: 'bg-blue-950/30 border-blue-500/30 text-blue-200',
      iconColor: 'text-blue-400',
      icon: Info,
    },
    success: {
      bg: 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200',
      iconColor: 'text-emerald-400',
      icon: CheckCircle2,
    },
    warning: {
      bg: 'bg-amber-950/30 border-amber-500/30 text-amber-200',
      iconColor: 'text-amber-400',
      icon: AlertTriangle,
    },
    danger: {
      bg: 'bg-rose-950/30 border-rose-500/30 text-rose-200',
      iconColor: 'text-rose-400',
      icon: AlertCircle,
    },
  };

  const current = configs[variant] || configs.info;
  const Icon = current.icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border ${current.bg} ${className}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1 text-sm">
        {title && <h5 className="font-semibold text-white mb-0.5">{title}</h5>}
        <div className="leading-relaxed opacity-95">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="p-1 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
