import React from 'react';
import {
  Layers,
  Shield,
  Database,
  Radio,
  Workflow,
  Cpu,
  Server,
  Lock,
  FileCode,
  Terminal,
} from 'lucide-react';

export const ArchitecturePage = () => {
  const modules = [
    {
      name: 'Auth Module',
      path: '/api/v1/auth',
      features: [
        'Pluggable JWT strategy',
        'Clerk adapter ready',
        'Role-based access (RBAC)',
        'Rate-limited login',
      ],
      tag: 'Security',
    },
    {
      name: 'Users Module',
      path: '/api/v1/users',
      features: [
        'Reputation trust score',
        'Profile management',
        'Identity verification flags',
        'Admin user index',
      ],
      tag: 'Identity',
    },
    {
      name: 'Assets Module',
      path: '/api/v1/assets',
      features: [
        'Railway ticket schema',
        'Extensible for Bus & Events',
        'Unique PNR/hash deduplication',
        'Document proofs',
      ],
      tag: 'Core Domain',
    },
    {
      name: 'Listings Module',
      path: '/api/v1/listings',
      features: [
        'Anti-scalping price cap check',
        'Face value compliance',
        'Ownership validation',
        'State tracking',
      ],
      tag: 'Marketplace',
    },
    {
      name: 'Transactions Module',
      path: '/api/v1/transactions',
      features: [
        'Escrow fund locking',
        'Transfer proof recording',
        'Dispute state machine',
        'Release triggers',
      ],
      tag: 'Escrow',
    },
    {
      name: 'Verification Module',
      path: '/api/v1/verification',
      features: [
        'Multi-tier fraud checks',
        'Inngest async job dispatch',
        'Format & duplicate validation',
        'Confidence scoring',
      ],
      tag: 'Anti-Fraud',
    },
    {
      name: 'Notifications Module',
      path: '/api/v1/notifications',
      features: [
        'Socket.IO real-time broadcast',
        'Room-based delivery',
        'In-app notification storage',
        'Read state tracking',
      ],
      tag: 'Real-Time',
    },
    {
      name: 'Reports Module',
      path: '/api/v1/reports',
      features: [
        'Fraud & scam reporting',
        'Dispute categorization',
        'Admin escalation queue',
        'Resolution audit trails',
      ],
      tag: 'Disputes',
    },
    {
      name: 'Admin Module',
      path: '/api/v1/admin',
      features: [
        'Aggregated platform metrics',
        'Dispute decision engine',
        'Audit logging',
        'Privileged RBAC gate',
      ],
      tag: 'Governance',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          System Architecture & Blueprint
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Clean separation of concerns, modular domain isolation, centralized error handling, and
          extensible adapters.
        </p>
      </div>

      {/* Layering Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="p-5 rounded-2xl glass-card border border-blue-500/20 space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <Server className="w-4 h-4" /> 1. HTTP / Transport
          </div>
          <p className="text-slate-400">
            Express router, versioned routes (<code className="text-blue-300">/api/v1</code>),
            security headers, CORS, and Zod schema validation middleware.
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-indigo-500/20 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Cpu className="w-4 h-4" /> 2. Controllers & Adapters
          </div>
          <p className="text-slate-400">
            Transforms HTTP request/response, wraps async execution with{' '}
            <code className="text-indigo-300">asyncHandler</code>, and delegates to service
            interfaces.
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-purple-500/20 space-y-3">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
            <Workflow className="w-4 h-4" /> 3. Services & Domain
          </div>
          <p className="text-slate-400">
            Encapsulates business rules, anti-fraud scoring, escrow status transitions, and triggers
            background Inngest jobs.
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Database className="w-4 h-4" /> 4. Repositories & DB
          </div>
          <p className="text-slate-400">
            Abstracts Mongoose models, handles database querying, pagination, indexing, and
            connection lifecycle resilience.
          </p>
        </div>
      </div>

      {/* Backend Modules Matrix */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" /> Modular Domain Architecture (9 Modules)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {modules.map((m, idx) => (
            <div key={idx} className="p-5 rounded-2xl glass-card border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{m.name}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-blue-400 border border-slate-700">
                  {m.tag}
                </span>
              </div>

              <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                {m.path}
              </div>

              <ul className="text-xs text-slate-400 space-y-1.5 pt-1">
                {m.features.map((f, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
