import React from 'react';

const statusStyles = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  VERIFIED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PENDING_VERIFICATION: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ESCROWED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  COMPLETED: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  CANCELLED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export const StatusBadge = ({ status = 'ACTIVE', text = null }) => {
  const badgeClass = statusStyles[status] || 'bg-slate-500/10 text-slate-300 border-slate-500/20';
  const label = text || status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass} uppercase tracking-wider`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80 animate-pulse"></span>
      {label}
    </span>
  );
};
