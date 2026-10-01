import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck, Info } from 'lucide-react';

/**
 * Universal Badge and Verification Badge component
 * Meets accessibility requirement: NEVER communicates status through color alone.
 */
export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  icon: Icon,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-semibold tracking-wider uppercase',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700',
    verified: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full shrink-0 select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
};

/**
 * High-profile Verification Status Badge
 * Types: VERIFIED (✓ Verified), NEEDS_REVIEW (⚠ Needs Review), FAILED (✕ Failed), PENDING (⏳ Pending)
 */
export const VerificationStatusBadge = ({ status = 'VERIFIED', size = 'md' }) => {
  const normStatus = (status || '').toUpperCase();

  switch (normStatus) {
    case 'VERIFIED':
    case 'APPROVED':
      return (
        <Badge variant="verified" size={size} icon={CheckCircle2}>
          ✓ Verified
        </Badge>
      );
    case 'NEEDS_REVIEW':
    case 'MANUAL_REVIEW':
    case 'SUSPICIOUS':
      return (
        <Badge variant="warning" size={size} icon={AlertTriangle}>
          ⚠ Needs Review
        </Badge>
      );
    case 'FAILED':
    case 'REJECTED':
      return (
        <Badge variant="danger" size={size} icon={XCircle}>
          ✕ Verification Failed
        </Badge>
      );
    case 'PENDING':
    case 'IN_PROGRESS':
    case 'PROCESSING':
    default:
      return (
        <Badge variant="info" size={size} icon={Clock}>
          ⏳ Verification Pending
        </Badge>
      );
  }
};
