import React from 'react';
import { ShieldCheck, GitBranch, Terminal, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-slate-300">Secure Asset Exchange Architecture</span>
          <span className="text-slate-600">|</span>
          <span>Initial Use-Case: Railway Ticket Anti-Fraud Transfer</span>
        </div>

        <div className="flex items-center gap-6 text-slate-400">
          <span className="flex items-center gap-1.5 font-mono">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" /> API /api/v1
          </span>
          <span className="flex items-center gap-1.5 font-mono">
            <GitBranch className="w-3.5 h-3.5 text-purple-400" /> Modular Architecture
          </span>
        </div>
      </div>
    </footer>
  );
};
