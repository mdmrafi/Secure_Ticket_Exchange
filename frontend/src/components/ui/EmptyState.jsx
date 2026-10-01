import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button.jsx';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There are currently no items matching your criteria in this section.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-bold text-white mb-1.5">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
