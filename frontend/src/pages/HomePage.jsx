import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Train,
  Bus,
  Ticket,
  FileCheck,
  Lock,
  Zap,
  Cpu,
  Layers,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { apiService } from '../services/api.service.js';

export const HomePage = () => {
  const [healthData, setHealthData] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealthNow = async () => {
    setIsChecking(true);
    try {
      const res = await apiService.checkHealth();
      setHealthData(res.data);
    } catch (e) {
      setHealthData({ status: 'unreachable', error: e.message });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealthNow();
  }, []);

  const assetPillars = [
    {
      title: 'Railway Tickets',
      badge: 'Active Focus (v1)',
      desc: 'Prevents counterfeit PDFs, double-selling of PNRs, and scalping with biometric/verified transfer escrow.',
      icon: Train,
      color: 'from-blue-600 to-indigo-600',
      active: true,
    },
    {
      title: 'Intercity Bus Passes',
      badge: 'Supported in Schema',
      desc: 'Standardized seat reservation transfers for long-distance coach networks with ticket hash verification.',
      icon: Bus,
      color: 'from-emerald-600 to-teal-600',
      active: false,
    },
    {
      title: 'Event & Concert Passes',
      badge: 'Supported in Schema',
      desc: 'Anti-fraud barcode rotation and proof-of-transfer contracts for live concerts and stadium sports.',
      icon: Ticket,
      color: 'from-purple-600 to-pink-600',
      active: false,
    },
    {
      title: 'Legal Documents & Rights',
      badge: 'Supported in Schema',
      desc: 'Cryptographic hash checks and verified transfer logs for legally tradeable contracts and permits.',
      icon: FileCheck,
      color: 'from-amber-600 to-orange-600',
      active: false,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Production-Oriented Foundation Ready</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Fraud-Resistant Secondary{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Digital Asset Exchange
          </span>
        </h1>

        <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Initial use-case stops fraud, forged PDFs, and black-market scalping in railway ticket
          transfers. Architected from day one to scale into bus passes, live events, and
          transferable documents.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/listings"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]"
          >
            <span>Explore Exchange Platform</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/architecture"
            className="flex items-center gap-2 px-6 py-3 rounded-xl glass-card text-slate-200 hover:text-white hover:border-slate-500 text-sm font-semibold transition-all"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Architecture Breakdown</span>
          </Link>
        </div>
      </section>

      {/* Live System Diagnostics Banner */}
      <section className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" /> Live Backend Architecture Status
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Validates REST endpoints, MongoDB connection layer, and environment config
            </p>
          </div>
          <button
            onClick={checkHealthNow}
            disabled={isChecking}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-medium transition cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Ping /api/v1/health'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-500 block mb-1">API Status</span>
            <span
              className={`font-semibold text-sm ${
                healthData?.status === 'healthy'
                  ? 'text-emerald-400'
                  : healthData?.status === 'degraded'
                    ? 'text-amber-400'
                    : 'text-rose-400'
              }`}
            >
              {healthData?.status ? healthData.status.toUpperCase() : 'UNKNOWN'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-500 block mb-1">MongoDB Connection</span>
            <span
              className={`font-semibold text-sm ${
                healthData?.database?.connected ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {healthData?.database?.status
                ? healthData.database.status.toUpperCase()
                : 'DISCONNECTED'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-500 block mb-1">Uptime</span>
            <span className="font-semibold text-sm text-slate-200">
              {healthData?.uptimeSeconds !== undefined ? `${healthData.uptimeSeconds}s` : 'N/A'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-500 block mb-1">Active Version</span>
            <span className="font-semibold text-sm text-indigo-300">
              {healthData?.version ? `v${healthData.version}` : '/api/v1'}
            </span>
          </div>
        </div>
      </section>

      {/* Asset Expansion Matrix */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Supported & Roadmap Asset Classes</h2>
          <p className="text-xs text-slate-400 mt-1">
            Polymorphic asset schema accommodates varying verification mechanics and metadata.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {assetPillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl glass-card border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        item.active
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Schema Support</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Architectural Guarantees */}
      <section className="p-8 rounded-2xl glass-card border border-slate-800 space-y-6">
        <h2 className="text-xl font-bold text-white">
          Production Architecture Principles Implemented
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Lock className="w-4 h-4 text-blue-400" /> Pluggable Auth (JWT & Clerk)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Standardized <code className="text-blue-300">AuthProviderInterface</code> allows
              instantaneous switch between native JWT and managed identity (Clerk) without touching
              route controllers.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Layers className="w-4 h-4 text-purple-400" /> Controller-Service-Repository
            </div>
            <p className="text-slate-400 leading-relaxed">
              Clean separation of concerns with HTTP transport, business orchestration, and Mongoose
              persistence isolated across 9 dedicated backend modules.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Zap className="w-4 h-4 text-emerald-400" /> Inngest & Socket.IO
            </div>
            <p className="text-slate-400 leading-relaxed">
              Event-driven background pipeline for fraud detection and OCR parsing combined with
              Socket.IO for real-time escrow alerts and order state changes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
