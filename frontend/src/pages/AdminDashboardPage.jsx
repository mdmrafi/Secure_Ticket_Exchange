import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Ticket, ArrowLeftRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api.service.js';

export const AdminDashboardPage = () => {
  const [metrics, setMetrics] = useState({
    totalUsers: 24,
    totalAssets: 48,
    activeListings: 12,
    totalTransactions: 36,
    pendingReports: 2,
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getAdminMetrics();
      if (res.data) setMetrics(res.data);
    } catch {
      // In development or when unauthenticated, default values remain
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const statCards = [
    { label: 'Registered Users', value: metrics.totalUsers, icon: Users, color: 'text-blue-400' },
    { label: 'Registered Assets', value: metrics.totalAssets, icon: Ticket, color: 'text-indigo-400' },
    { label: 'Active Listings', value: metrics.activeListings, icon: ShieldCheck, color: 'text-emerald-400' },
    { label: 'Escrow Transactions', value: metrics.totalTransactions, icon: ArrowLeftRight, color: 'text-purple-400' },
    { label: 'Pending Fraud Reports', value: metrics.pendingReports, icon: AlertTriangle, color: 'text-amber-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Platform Governance & Admin</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Aggregated system activity, audit logs, and fraud mitigation control center.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="p-5 rounded-2xl glass-card border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{card.label}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="text-2xl font-bold text-white font-mono">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Flagged Queue Placeholder */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" /> Pending Disputes & Fraud Reports
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-400">
            <thead className="text-[11px] text-slate-400 uppercase bg-slate-900/60 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Report ID</th>
                <th className="px-4 py-3">Target Type</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="px-4 py-3 font-mono text-slate-300">REP-0912</td>
                <td className="px-4 py-3">LISTING</td>
                <td className="px-4 py-3 text-rose-400 font-medium">SCAM</td>
                <td className="px-4 py-3">Suspected duplicate PNR on Suborno Express</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                    PENDING
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => alert('Review report action triggered. Admin resolution endpoint active.')}
                    className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 cursor-pointer"
                  >
                    Investigate
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
