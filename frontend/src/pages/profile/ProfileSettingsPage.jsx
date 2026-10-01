import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Lock,
  KeyRound,
  Smartphone,
  History,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Mail,
  Phone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Badge, VerificationStatusBadge } from '../../components/ui/Badge.jsx';

export const ProfileSettingsPage = () => {
  const { user, isKycVerified } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeSessions = [
    {
      device: 'Chrome on Windows 11',
      ip: '103.205.71.14 (Dhaka, BD)',
      status: 'Current Active Session',
      isCurrent: true,
    },
    {
      device: 'Safari on iPhone 15 Pro',
      ip: '103.205.71.88 (Dhaka, BD)',
      status: 'Active 4 hours ago',
      isCurrent: false,
    },
  ];

  const handleSave = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Profile & Security Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your verified identity, credentials, active sessions, and communication privacy.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Security preferences updated and logged to audit ledger.</span>
        </div>
      )}

      {/* 1. PROFILE OVERVIEW CARD */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-extrabold text-2xl">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{user?.name || 'Trader'}</h2>
                <VerificationStatusBadge
                  status={isKycVerified ? 'VERIFIED' : 'PENDING'}
                  size="sm"
                />
              </div>
              <p className="text-xs text-slate-400">Account ID: {user?._id || 'usr_demo'}</p>
            </div>
          </div>

          <div className="text-xs sm:text-right text-slate-400 space-y-0.5">
            <p>
              Member since:{' '}
              <strong className="text-white">{user?.joinedDate || 'June 2025'}</strong>
            </p>
            <p>
              Completed Trades:{' '}
              <strong className="text-emerald-400">{user?.completedTransactions || 19}</strong>
            </p>
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" value={user?.name || ''} readOnly />
          <Input label="Email Address" value={user?.email || ''} readOnly />
          <Input label="Phone Number" value={user?.phone || '+880 1712-345678'} readOnly />
          <Input
            label="KYC Level"
            value={isKycVerified ? 'Level 2 (Biometric Verified)' : 'Not Verified'}
            readOnly
          />
        </form>
      </div>

      {/* 2. SECURITY & AUTHENTICATION SETTINGS */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-400" />
          <span>Security & Session Protection</span>
        </h3>

        {/* 2FA Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs font-bold text-white">Two-Factor Authentication (2FA)</p>
              <p className="text-[11px] text-slate-400">
                Protect withdrawals, ticket transfers, and logins with TOTP authenticator code.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              twoFactorEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Active Sessions */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active Device Sessions
          </h4>
          <div className="space-y-2">
            {activeSessions.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
              >
                <div>
                  <p className="font-bold text-white">{s.device}</p>
                  <p className="text-slate-400 text-[11px]">IP: {s.ip}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.isCurrent ? 'verified' : 'default'} size="sm">
                    {s.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
