import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  Clock,
  Ticket,
  DollarSign,
  AlertTriangle,
  FileText,
  Search,
  ArrowRight,
  TrendingUp,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

export const AdminDashboardPage = () => {
  const metrics = [
    {
      label: 'Total Users',
      value: '4,120',
      change: '+12% this week',
      icon: Users,
      color: 'text-blue-400',
    },
    {
      label: 'Verified KYC Users',
      value: '3,890',
      change: '94.4% verification rate',
      icon: CheckCircle2,
      color: 'text-emerald-400',
    },
    {
      label: 'Pending KYC Reviews',
      value: '14',
      change: 'Requires manual review',
      icon: Clock,
      color: 'text-amber-400',
    },
    {
      label: 'Active Listings',
      value: '312',
      change: '0% scalping compliance',
      icon: Ticket,
      color: 'text-purple-400',
    },
    {
      label: 'Settled Transactions',
      value: '৳1,842,500',
      change: 'Zero escrow disputes',
      icon: DollarSign,
      color: 'text-emerald-400',
    },
    {
      label: 'Suspicious Signals',
      value: '3 Assets',
      change: 'Flagged for inspection',
      icon: AlertTriangle,
      color: 'text-rose-400',
    },
  ];

  const pendingReviews = [
    {
      id: 'KYC-8812',
      user: 'Tanvir Hossain',
      doc: 'National ID (Smart NID)',
      time: '14 mins ago',
      status: 'MANUAL_REVIEW_REQUIRED',
    },
    {
      id: 'KYC-8814',
      user: 'Farhana Ahmed',
      doc: 'Passport Bio-data Page',
      time: '42 mins ago',
      status: 'PENDING_OCR_CHECK',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
              ENTERPRISE AUDIT & RISK CONTROL
            </span>
            <Badge variant="purple" size="sm">
              Admin Role Active
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Security & Operations Center
          </h1>
          <p className="text-xs text-slate-400">
            Real-time telemetry, fraud risk scoring, statutory compliance, and immutable audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/risk">
            <Button
              variant="outline"
              size="sm"
              icon={AlertTriangle}
              className="border-rose-500/30 text-rose-300"
            >
              Risk Center (3)
            </Button>
          </Link>
          <Link to="/admin/kyc">
            <Button variant="primary" size="sm">
              Review KYC Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Operational Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{m.label}</span>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white tracking-tight">{m.value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{m.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Operational Views */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Verification & Transaction Telemetry */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Verification Outcomes (Past 30 Days)
                </h3>
                <p className="text-xs text-slate-400">Automated vs Manual Review Ratio</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                98.2% Auto-Cleared
              </span>
            </div>

            {/* Visual Histogram Bars */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">
                    Railway Tickets (Automated PNR + Timetable)
                  </span>
                  <span className="text-white font-mono font-semibold">1,420 passed (99.1%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '99.1%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">
                    Intercity Bus Passes (Barcode Hash + Route)
                  </span>
                  <span className="text-white font-mono font-semibold">680 passed (96.5%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '96.5%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Concert & Live Event Passes</span>
                  <span className="text-white font-mono font-semibold">410 passed (94.2%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '94.2%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Audit Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/admin/audit"
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between"
            >
              <div>
                <h4 className="text-xs font-bold text-white">Immutable Audit Ledger</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Filter by actor, resource, and timestamp
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/admin/risk"
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between"
            >
              <div>
                <h4 className="text-xs font-bold text-rose-300">Fraud & Risk Center</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  3 active alerts under investigation
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Right Col: Pending KYC Queue */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Pending KYC Queue</h3>
            <Link to="/admin/kyc" className="text-xs text-blue-400 hover:underline">
              View queue
            </Link>
          </div>

          <div className="space-y-3">
            {pendingReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{rev.user}</span>
                  <span className="text-[10px] text-slate-500">{rev.time}</span>
                </div>
                <p className="text-slate-400 text-[11px]">{rev.doc}</p>
                <div className="flex items-center justify-between pt-1">
                  <Badge variant="warning" size="sm">
                    Action Needed
                  </Badge>
                  <Link to="/admin/kyc">
                    <span className="text-blue-400 font-semibold hover:underline">Inspect →</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
