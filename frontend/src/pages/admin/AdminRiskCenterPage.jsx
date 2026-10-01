import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  FileText,
  UserX,
  CreditCard,
  Ban,
  Activity,
  History,
  Lock,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';

export const AdminRiskCenterPage = () => {
  const [selectedAlertIndex, setSelectedAlertIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [actionNotice, setActionNotice] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, type: '', title: '' });

  const alerts = [
    {
      id: 'RISK-4091',
      severity: 'CRITICAL',
      assetType: 'RAILWAY_TICKET',
      assetId: 'AST-8921',
      title: 'Duplicate Document Hash Across Multiple Accounts',
      timestamp: 'Today at 11:24 AM',
      signals: [
        {
          code: 'SIG-DUP-01',
          name: 'Duplicate Document Hash',
          detail: 'SHA-256 binary hash matches an existing active listing AST-7810.',
        },
        {
          code: 'SIG-OCR-03',
          name: 'OCR Inconsistency',
          detail:
            'Coach number "Ka-4" font metrics deviate from standard Bangladesh Railway PDF template.',
        },
        {
          code: 'SIG-DEV-02',
          name: 'Unusual Account Activity',
          detail: 'Account created 25 minutes ago from known VPN endpoint.',
        },
      ],
      user: {
        id: 'USR-9024',
        name: 'Saiful Islam (Unverified)',
        email: 's.islam789@tempmail.org',
        kycStatus: 'Not Started',
        failedAttempts: 4,
      },
      relatedAsset: {
        id: 'AST-8921',
        title: 'Suborno Express (Dhaka → Chittagong)',
        seat: 'Ka-4 / 22',
        journeyDate: '2026-10-14',
        price: '৳805',
      },
      relatedTransactions: [
        {
          id: 'TX-10901',
          amount: '৳805',
          status: 'HELD_IN_ESCROW',
          counterparty: 'Arif Chowdhury',
        },
      ],
      investigationNotes: [
        'Automated risk heuristics flagged identical PDF raw byte stream with 99.8% structural similarity to ticket uploaded yesterday.',
        'Buyer Arif Chowdhury has completed reservation payment; funds are currently isolated in protected escrow.',
      ],
    },
    {
      id: 'RISK-4088',
      severity: 'HIGH',
      assetType: 'BUS_TICKET',
      assetId: 'AST-8890',
      title: 'External Verification Route Mismatch',
      timestamp: 'Yesterday at 04:12 PM',
      signals: [
        {
          code: 'SIG-EXT-01',
          name: 'External Verification Mismatch',
          detail: 'Provider API reported route Dhaka → Sylhet, but OCR extracted Dhaka → Rajshahi.',
        },
        {
          code: 'SIG-TX-04',
          name: 'Repeated Failed Transactions',
          detail: '2 consecutive checkout cancellations within 10 minutes.',
        },
      ],
      user: {
        id: 'USR-8711',
        name: 'Rashedul Karim',
        email: 'rashed.k@example.com',
        kycStatus: 'Verified (Smart NID)',
        failedAttempts: 2,
      },
      relatedAsset: {
        id: 'AST-8890',
        title: 'Green Line Paribahan AC Business',
        seat: 'B2',
        journeyDate: '2026-10-20',
        price: '৳1,400',
      },
      relatedTransactions: [],
      investigationNotes: [
        'User was notified of automated mismatch and requested a manual re-inspection.',
      ],
    },
    {
      id: 'RISK-4074',
      severity: 'MEDIUM',
      assetType: 'EVENT_TICKET',
      assetId: 'AST-8742',
      title: 'Suspicious Rapid Listing Frequency',
      timestamp: '2 days ago',
      signals: [
        {
          code: 'SIG-VOL-02',
          name: 'Suspicious Listing Activity',
          detail: 'User posted 5 listings in 12 minutes (approaching velocity limit).',
        },
      ],
      user: {
        id: 'USR-6520',
        name: 'Munira Begum',
        email: 'munira.b@gmail.com',
        kycStatus: 'Verified (Passport)',
        failedAttempts: 0,
      },
      relatedAsset: {
        id: 'AST-8742',
        title: 'Dhaka Tech Summit VIP Delegate Pass',
        seat: 'Row C-14',
        journeyDate: '2026-11-05',
        price: '৳2,500',
      },
      relatedTransactions: [
        { id: 'TX-10440', amount: '৳2,500', status: 'COMPLETED', counterparty: 'Hassan Mahmud' },
      ],
      investigationNotes: [
        'User explained team purchased group tickets and is liquidating unused company passes.',
      ],
    },
  ];

  const filteredAlerts = alerts.filter((a) => {
    if (activeFilter === 'ALL') return true;
    return a.severity === activeFilter;
  });

  const current = filteredAlerts[selectedAlertIndex] || filteredAlerts[0] || alerts[0];

  const handleAction = (type, title) => {
    setActionModal({ isOpen: true, type, title });
  };

  const confirmAction = () => {
    setActionNotice({
      type: actionModal.type,
      title: actionModal.title,
      target: current.id,
      timestamp: new Date().toLocaleTimeString(),
      admin: 'Security Admin (You)',
    });
    setActionModal({ isOpen: false, type: '', title: '' });
  };

  const getSeverityBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return (
          <Badge variant="danger" size="sm">
            CRITICAL RISK
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge variant="warning" size="sm">
            HIGH RISK
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge variant="blue" size="sm">
            MEDIUM RISK
          </Badge>
        );
      default:
        return (
          <Badge variant="slate" size="sm">
            LOW RISK
          </Badge>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Console
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
            Fraud Prevention & Risk Investigation Center
          </h1>
          <p className="text-xs text-slate-400">
            Multi-signal risk heuristic investigation, asset isolation, and escrow fund protection.
          </p>
        </div>

        {/* Philosophy notice badge */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 max-w-sm text-xs text-slate-300">
          <p className="font-semibold text-amber-300 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Heuristic Integrity Principle
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Machine learning outputs provide{' '}
            <strong className="text-slate-200">risk assessments</strong> and flag suspicious
            signals. Only authorized human administrators confirm determinations.
          </p>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/40 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-rose-400" />
            <div className="text-xs">
              <span className="font-bold text-white uppercase tracking-wider">
                Action Executed & Logged:
              </span>{' '}
              <span className="text-slate-300">
                "{actionNotice.title}" on{' '}
                <strong className="text-white">{actionNotice.target}</strong> by{' '}
                {actionNotice.admin} at {actionNotice.timestamp}.
              </span>
            </div>
          </div>
          <Link to="/admin/audit" className="text-xs text-blue-400 hover:underline">
            View Immutable Audit Entry →
          </Link>
        </div>
      )}

      {/* Main Grid: Alert List (1 Col) & Investigation Workspace (3 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Filterable Alert Queue */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Risk Assessments
            </h3>
            <span className="text-xs text-slate-500 font-mono">3 Active</span>
          </div>

          {/* Severity Filters */}
          <div className="flex gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setActiveFilter(lvl);
                  setSelectedAlertIndex(0);
                }}
                className={`flex-1 py-1 rounded-lg font-medium transition ${
                  activeFilter === lvl
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Alert Cards */}
          <div className="space-y-2">
            {filteredAlerts.map((alertItem, idx) => (
              <button
                key={alertItem.id}
                onClick={() => setSelectedAlertIndex(idx)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedAlertIndex === idx
                    ? 'bg-rose-500/10 border-rose-500/50 shadow-md ring-1 ring-rose-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-slate-400">{alertItem.id}</span>
                  {getSeverityBadge(alertItem.severity)}
                </div>
                <div className="font-bold text-white text-xs line-clamp-1">{alertItem.title}</div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>{alertItem.assetType.replace('_', ' ')}</span>
                  <span>{alertItem.timestamp}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Deep Investigation Workspace */}
        <div className="lg:col-span-3 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            {/* Investigation Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">{current.id}</span>
                  {getSeverityBadge(current.severity)}
                  <Badge variant="slate" size="sm">
                    {current.assetType}
                  </Badge>
                </div>
                <h2 className="text-xl font-extrabold text-white">{current.title}</h2>
                <p className="text-xs text-slate-400">Flagged on {current.timestamp}</p>
              </div>

              {/* Action Buttons for Mitigation */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('SUSPEND_LISTING', 'Suspend Asset Listing')}
                  className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                >
                  <Ban className="w-4 h-4 mr-1.5" />
                  Suspend Listing
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('FREEZE_ESCROW', 'Freeze Transaction Escrow')}
                  className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                >
                  <CreditCard className="w-4 h-4 mr-1.5" />
                  Freeze Escrow
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleAction('SUSPEND_USER', 'Suspend User Account')}
                >
                  <UserX className="w-4 h-4 mr-1.5" />
                  Suspend User
                </Button>
              </div>
            </div>

            {/* Suspicious Signals Detected */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Suspicious Signals Detected
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {current.signals.map((sig) => (
                  <div
                    key={sig.code}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{sig.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{sig.code}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{sig.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Investigation Cards: Actor & Related Asset */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Metadata */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-400" /> Account Profile Under Review
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Account ID</span>
                    <span className="font-mono font-semibold text-white">{current.user.id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Account Name</span>
                    <span className="font-semibold text-white">{current.user.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Email Address</span>
                    <span className="text-slate-300">{current.user.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">KYC Status</span>
                    <Badge
                      variant={current.user.kycStatus.includes('Verified') ? 'success' : 'danger'}
                      size="sm"
                    >
                      {current.user.kycStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Failed Checkouts</span>
                    <span className="font-mono font-bold text-rose-400">
                      {current.user.failedAttempts} attempts
                    </span>
                  </div>
                </div>
              </div>

              {/* Related Asset Details */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-400" /> Target Asset Under Inspection
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Asset Identifier</span>
                    <span className="font-mono font-semibold text-white">
                      {current.relatedAsset.id}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Service / Route</span>
                    <span className="font-semibold text-white">{current.relatedAsset.title}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Seat / Allocation</span>
                    <span className="font-mono text-slate-300">{current.relatedAsset.seat}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Journey Date</span>
                    <span className="text-slate-300">{current.relatedAsset.journeyDate}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Listing Price</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {current.relatedAsset.price}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Transactions & Escrow State */}
            {current.relatedTransactions.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Active Protected
                  Transactions
                </h4>
                <div className="space-y-2">
                  {current.relatedTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-white mr-2">{tx.id}</span>
                        <span className="text-slate-400">Buyer: {tx.counterparty}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-emerald-400">{tx.amount}</span>
                        <Badge variant="warning" size="sm">
                          ESCROW PROTECTED
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Investigator Notes */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider">
                Investigator Telemetry Findings
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                {current.investigationNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, type: '', title: '' })}
        title={actionModal.title}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            You are initiating administrative action{' '}
            <strong className="text-white">"{actionModal.title}"</strong> on target{' '}
            <strong className="text-white">{current.id}</strong>.
          </p>
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-1">
            <p className="font-semibold">Security Safeguards:</p>
            <p className="text-[11px]">
              - If freezing escrow, buyer and seller funds remain locked until manual dispute
              resolution.
              <br />
              - The user will be notified of an account hold under compliance regulations.
              <br />- This action is cryptographically tied to your Admin ID in the audit log.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActionModal({ isOpen: false, type: '', title: '' })}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={confirmAction}>
              Confirm Action
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
