import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Ticket,
  Lock,
  PlusCircle,
  FileCheck,
  AlertCircle,
  Train,
  ChevronRight,
  RefreshCw,
  Bell,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge, VerificationStatusBadge } from '../../components/ui/Badge.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.jsx';

export const UserDashboardPage = () => {
  const { user, isKycVerified, currentRole } = useAuth();

  const metrics = [
    {
      label: 'Identity Status',
      value: isKycVerified ? 'Verified' : 'Action Required',
      badge: isKycVerified ? 'LEVEL 2' : 'PENDING',
      badgeVariant: isKycVerified ? 'verified' : 'warning',
      desc: isKycVerified ? 'Govt. NID biometrics active' : 'Complete KYC to enable listing',
      icon: ShieldCheck,
      iconColor: isKycVerified
        ? 'text-emerald-400 bg-emerald-500/10'
        : 'text-amber-400 bg-amber-500/10',
    },
    {
      label: 'Active Listings',
      value: '2 Assets',
      badge: 'Escrow Protected',
      badgeVariant: 'info',
      desc: '1 Railway Ticket, 1 Bus Pass',
      icon: Ticket,
      iconColor: 'text-blue-400 bg-blue-500/10',
    },
    {
      label: 'Pending Transactions',
      value: '1 Active',
      badge: 'Reserved (07:42)',
      badgeVariant: 'warning',
      desc: 'Suborno Express (701) #TX-10293',
      icon: Clock,
      iconColor: 'text-amber-400 bg-amber-500/10',
    },
    {
      label: 'Completed Exchanges',
      value: `${user?.completedTransactions || 19} Safe Trades`,
      badge: 'Zero Disputes',
      badgeVariant: 'verified',
      desc: '100% verified legal fulfillment',
      icon: Lock,
      iconColor: 'text-purple-400 bg-purple-500/10',
    },
  ];

  const recentListings = [
    {
      id: 'LST-8901',
      assetType: 'RAILWAY_TICKET',
      service: 'Suborno Express (701)',
      route: 'Dhaka → Chittagong',
      departure: 'Tomorrow, 07:00 AM',
      seat: 'Coach KHA • Seat 18 (AC Chair)',
      askingPrice: 805,
      status: 'RESERVED',
      reservationTime: '07:42 remaining',
    },
    {
      id: 'LST-9104',
      assetType: 'BUS_TICKET',
      service: 'Hanif Enterprise (Scania Multi-Axle)',
      route: "Dhaka → Cox's Bazar",
      departure: '05 Oct, 10:30 PM',
      seat: 'Seat B3 (AC Executive)',
      askingPrice: 1300,
      status: 'ACTIVE',
      views: 34,
    },
  ];

  const recentActivity = [
    {
      id: 'ACT-1',
      title: 'Buyer initiated atomic reservation',
      time: '2 minutes ago',
      desc: 'Suborno Express (701) reserved by verified user Tanvir H. 10:00 lock activated.',
      type: 'RESERVATION',
      icon: Lock,
      color: 'text-amber-400',
    },
    {
      id: 'ACT-2',
      title: 'Ticket OCR & checksum verified',
      time: '2 hours ago',
      desc: 'Bangladesh Railway PNR 89342019 verified through railway adapter gateway.',
      type: 'VERIFICATION',
      icon: CheckCircle2,
      color: 'text-emerald-400',
    },
    {
      id: 'ACT-3',
      title: 'Escrow payment released',
      time: 'Yesterday',
      desc: 'Transaction #TX-10280 completed. ৳1,200 credited to payout account.',
      type: 'TRANSACTION',
      icon: ShieldCheck,
      color: 'text-blue-400',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. GREETING & VERIFICATION STATUS WIDGET */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Good morning, {user?.name || 'Trader'}
            </h1>
            {isKycVerified ? (
              <Badge variant="verified" size="sm">
                ✓ Level 2 Verified
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                ⚠ KYC Required
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Account #{user?._id || 'usr_demo'} • Member since {user?.joinedDate || '2025'}
          </p>
        </div>

        {/* Prominent Verification Status Component */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Identity:</span>
            <span
              className={isKycVerified ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}
            >
              {isKycVerified ? '✓ Verified' : '⚠ Action Needed'}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Ticket Verification:</span>
            <span className="text-emerald-400 font-bold">✓ Multi-Layer Active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Account Security:</span>
            <span className="text-emerald-400 font-bold">✓ Protected</span>
          </div>
        </div>
      </div>

      {/* KYC Warning Banner if Unverified */}
      {!isKycVerified && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm">
                Identity Verification Required for Listing Tickets
              </p>
              <p className="text-slate-300 mt-0.5">
                In compliance with transport safety laws, you must complete quick Level 2 KYC before
                listing digital assets for sale.
              </p>
            </div>
          </div>
          <Link to="/kyc" className="shrink-0">
            <Button variant="primary" size="sm">
              Complete KYC (2 mins)
            </Button>
          </Link>
        </div>
      )}

      {/* 2. SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{m.label}</span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${m.iconColor}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">{m.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-slate-400">{m.desc}</p>
                  <Badge variant={m.badgeVariant} size="sm">
                    {m.badge}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. MAIN WORKSPACE: Current Listings & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: My Active Listings & Escalations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">My Active Listings</h2>
              <p className="text-xs text-slate-400">
                Assets currently verified and listed on the marketplace
              </p>
            </div>
            <Link to="/upload">
              <Button variant="primary" size="sm" icon={PlusCircle}>
                Upload Asset
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {recentListings.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{item.id}</span>
                    <Badge
                      variant={item.assetType === 'RAILWAY_TICKET' ? 'info' : 'verified'}
                      size="sm"
                    >
                      {item.assetType.replace('_', ' ')}
                    </Badge>
                  </div>
                  {item.status === 'RESERVED' ? (
                    <Badge variant="warning" size="sm" icon={Clock}>
                      RESERVED ({item.reservationTime})
                    </Badge>
                  ) : (
                    <Badge variant="verified" size="sm">
                      ACTIVE ON MARKETPLACE
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Service & Route</span>
                    <p className="font-bold text-white text-sm">{item.service}</p>
                    <p className="text-slate-300">{item.route}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Seat Specification</span>
                    <p className="font-semibold text-slate-200">{item.seat}</p>
                    <p className="text-slate-400">{item.departure}</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-slate-400 block text-[11px]">Asking Price</span>
                    <p className="font-extrabold text-emerald-400 text-base">
                      ৳{item.askingPrice} BDT
                    </p>
                    <span className="text-[10px] text-slate-500">Transport price cap verified</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {item.status === 'RESERVED'
                      ? 'Exclusive buyer lock active. Awaiting payment escrow confirmation.'
                      : 'Listing is public. 34 interested verified buyers viewed.'}
                  </span>
                  <Link to={`/transactions`}>
                    <Button variant="secondary" size="sm" icon={Eye}>
                      View Status
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Recent Activity & Audit Trail */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">Security Audit Feed</h2>
            <Link to="/notifications" className="text-xs text-blue-400 hover:underline">
              View all
            </Link>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
            {recentActivity.map((act) => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  className="flex items-start gap-3 pb-4 border-b border-slate-800/60 last:border-0 last:pb-0"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className={`w-4 h-4 ${act.color}`} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-white">{act.title}</p>
                      <span className="text-[10px] text-slate-500 shrink-0">{act.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{act.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Shortcuts */}
          <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-500/20 space-y-3">
            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
              Quick Actions
            </h4>
            <div className="space-y-2">
              <Link
                to="/marketplace"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200"
              >
                <span>Browse Marketplace</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                to="/upload"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200"
              >
                <span>Verify & Upload New Ticket</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                to="/kyc"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200"
              >
                <span>Identity / KYC Management</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
