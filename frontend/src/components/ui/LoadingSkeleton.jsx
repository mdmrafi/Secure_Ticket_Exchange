import React from 'react';

export const LoadingSkeleton = ({ className = '', rounded = 'rounded-lg' }) => {
  return (
    <div className={`animate-pulse bg-slate-800/80 ${rounded} ${className}`} aria-hidden="true" />
  );
};

export const TicketCardSkeleton = () => (
  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
    <div className="flex items-center justify-between">
      <LoadingSkeleton className="h-5 w-28" />
      <LoadingSkeleton className="h-5 w-20 rounded-full" />
    </div>
    <div className="space-y-2 py-2">
      <LoadingSkeleton className="h-6 w-3/4" />
      <LoadingSkeleton className="h-4 w-1/2" />
    </div>
    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
      <LoadingSkeleton className="h-7 w-24" />
      <LoadingSkeleton className="h-9 w-28 rounded-xl" />
    </div>
  </div>
);

export const MetricSkeleton = () => (
  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
    <LoadingSkeleton className="h-4 w-24" />
    <LoadingSkeleton className="h-8 w-16" />
    <LoadingSkeleton className="h-3 w-32" />
  </div>
);
