import React from 'react';
import { ArrowLeftRight, Shield, CheckCircle, Clock, AlertTriangle, Lock } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.jsx';

export const EscrowDashboardPage = () => {
  const sampleTransactions = [
    {
      id: 'TX-2026-9041',
      assetTitle: 'Suborno Express - Dhaka to Chittagong (Seat 42)',
      amount: '৳850',
      status: 'ESCROWED',
      buyer: 'Rahim Ahmed',
      seller: 'Karim Ullah',
      step: 2, // 1: Initiated, 2: Escrow Held, 3: Transferred, 4: Released
      timestamp: '2026-10-01 02:45 AM',
    },
    {
      id: 'TX-2026-8812',
      assetTitle: 'Parabat Express - Dhaka to Sylhet (Seat 14)',
      amount: '৳395',
      status: 'COMPLETED',
      buyer: 'Tanvir Hossain',
      seller: 'Fahim Rahman',
      step: 4,
      timestamp: '2026-09-29 08:30 PM',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Escrow & Exchange Orders</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Zero-trust financial escrow guarantees buyer receives valid ticket and seller receives verified payment.
        </p>
      </div>

      <div className="space-y-6">
        {sampleTransactions.map((tx) => (
          <div key={tx.id} className="p-6 rounded-2xl glass-card border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-mono text-slate-400 block">{tx.id}</span>
                  <h3 className="text-base font-bold text-white">{tx.assetTitle}</h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-emerald-400">{tx.amount}</span>
                <StatusBadge status={tx.status} />
              </div>
            </div>

            {/* Escrow Step Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-emerald-400 flex items-center gap-1 font-semibold mb-1">
                  <CheckCircle className="w-3.5 h-3.5" /> 1. Order Initiated
                </span>
                <span className="text-[11px] text-slate-400">Buyer placed request</span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  tx.step >= 2
                    ? 'bg-purple-950/20 border-purple-500/30'
                    : 'bg-slate-900/40 border-slate-800/40 opacity-50'
                }`}
              >
                <span
                  className={`flex items-center gap-1 font-semibold mb-1 ${
                    tx.step >= 2 ? 'text-purple-400' : 'text-slate-500'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" /> 2. Funds in Escrow
                </span>
                <span className="text-[11px] text-slate-400">Locked in smart vault</span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  tx.step >= 3
                    ? 'bg-blue-950/20 border-blue-500/30'
                    : 'bg-slate-900/40 border-slate-800/40 opacity-50'
                }`}
              >
                <span
                  className={`flex items-center gap-1 font-semibold mb-1 ${
                    tx.step >= 3 ? 'text-blue-400' : 'text-slate-500'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> 3. Ticket Handover
                </span>
                <span className="text-[11px] text-slate-400">PNR verified & assigned</span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  tx.step >= 4
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-slate-900/40 border-slate-800/40 opacity-50'
                }`}
              >
                <span
                  className={`flex items-center gap-1 font-semibold mb-1 ${
                    tx.step >= 4 ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> 4. Payout Released
                </span>
                <span className="text-[11px] text-slate-400">Seller receives payment</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span>Buyer: <strong className="text-slate-200">{tx.buyer}</strong></span>
                <span>Seller: <strong className="text-slate-200">{tx.seller}</strong></span>
                <span className="text-slate-500">{tx.timestamp}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert(`Report dispute modal for ${tx.id}. Reports module ready.`)}
                  className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3 h-3" /> Report Dispute
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
