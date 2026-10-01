import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  WifiOff,
  Clock,
  ShieldAlert,
  Lock,
  ServerCrash,
  UploadCloud,
  FileQuestion,
  RefreshCw,
  Search,
  MessageSquare,
  Ticket,
  DollarSign,
  ArrowRight,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Layers,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton.jsx';

export const EdgeStatesPage = () => {
  const [activeEdgeTab, setActiveEdgeTab] = useState('EMPTY_MARKETPLACE');

  const edgeStates = [
    { id: 'EMPTY_MARKETPLACE', label: 'Empty Marketplace' },
    { id: 'NO_TRANSACTIONS', label: 'No Transactions' },
    { id: 'NO_MESSAGES', label: 'No Messages' },
    { id: 'UPLOAD_FAILURE', label: 'Upload Failure' },
    { id: 'VERIFY_UNAVAILABLE', label: 'Verification Unavailable' },
    { id: 'EXT_VERIFY_UNAVAILABLE', label: 'External API Offline' },
    { id: 'NETWORK_ERROR', label: 'Network Disconnected' },
    { id: 'SESSION_EXPIRED', label: 'Session Expired' },
    { id: 'UNAUTHORIZED_401', label: 'Unauthorized (401)' },
    { id: 'FORBIDDEN_403', label: 'Forbidden / KYC Required (403)' },
    { id: 'SERVER_ERROR_500', label: 'Server Error (500)' },
    { id: 'MANUAL_REVIEW', label: 'Under Manual Review' },
    { id: 'LOADING_PROCESSING', label: 'Processing State' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              ERROR & ZERO-STATE RESILIENCE
            </span>
            <Badge variant="amber" size="sm">
              Edge Cases (13)
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
            Edge States & Error Recovery Suite
          </h1>
          <p className="text-xs text-slate-400">
            Design guarantee: "Never leave blank screens." Every exception offers an intuitive,
            accessible fallback.
          </p>
        </div>

        <Link to="/marketplace">
          <Button variant="outline" size="sm">
            Back to Marketplace
          </Button>
        </Link>
      </div>

      {/* Edge State Selector Pills */}
      <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800">
        {edgeStates.map((state) => (
          <button
            key={state.id}
            onClick={() => setActiveEdgeTab(state.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              activeEdgeTab === state.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {state.label}
          </button>
        ))}
      </div>

      {/* Active State Container */}
      <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[460px]">
        {activeEdgeTab === 'EMPTY_MARKETPLACE' && (
          <EmptyState
            icon={Search}
            title="No Verified Tickets Found"
            description="We couldn't find any tickets matching your exact route, travel date, or class filter criteria. Try adjusting your parameters or enable ticket alert notifications."
            actionText="Clear All Filters"
            onAction={() => alert('Search filters reset to default')}
          />
        )}

        {activeEdgeTab === 'NO_TRANSACTIONS' && (
          <EmptyState
            icon={DollarSign}
            title="No Transaction History Yet"
            description="You have not purchased or exchanged any digital tickets through protected escrow. All completed bookings and transfers will be archived here."
            actionText="Explore Marketplace"
            onAction={() => (window.location.href = '/marketplace')}
          />
        )}

        {activeEdgeTab === 'NO_MESSAGES' && (
          <EmptyState
            icon={MessageSquare}
            title="Your Inbox is Clean"
            description="Secure communication channels open automatically when you initiate a ticket reservation or buyer inquiry. Sensitive personal data is strictly shielded."
            actionText="Browse Active Listings"
            onAction={() => (window.location.href = '/marketplace')}
          />
        )}

        {activeEdgeTab === 'UPLOAD_FAILURE' && (
          <div className="max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <Badge variant="danger" size="sm">
                File Upload Error
              </Badge>
              <h3 className="text-xl font-extrabold text-white">Document Read Failed</h3>
              <p className="text-xs text-slate-400">
                The uploaded file appears to be corrupted, password-protected, or exceeds the 15 MB
                file size limit. Please ensure your ticket is an unencrypted PDF or high-resolution
                JPG/PNG.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = '/upload')}
              >
                Choose Another File
              </Button>
              <Button variant="primary" size="sm" onClick={() => alert('Retrying upload...')}>
                <RefreshCw className="w-4 h-4 mr-1.5" /> Retry Upload
              </Button>
            </div>
          </div>
        )}

        {activeEdgeTab === 'VERIFY_UNAVAILABLE' && (
          <div className="max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <Badge variant="warning" size="sm">
                Pipeline Maintenance
              </Badge>
              <h3 className="text-xl font-extrabold text-white">
                Verification Engine Temporarily Busy
              </h3>
              <p className="text-xs text-slate-400">
                Our automated OCR extraction cluster is currently experiencing peak queue volume.
                Your ticket has been safely queued and will process within 3–5 minutes.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              Queue Position: <strong className="text-white">#12 in line</strong> (Estimated wait:
              2m 14s)
            </div>
            <div className="flex justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => (window.location.href = '/dashboard')}
              >
                Return to Dashboard
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => alert('Checking pipeline status...')}
              >
                Check Status
              </Button>
            </div>
          </div>
        )}

        {activeEdgeTab === 'EXT_VERIFY_UNAVAILABLE' && (
          <div className="max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
              <ServerCrash className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <Badge variant="purple" size="sm">
                Provider Offline
              </Badge>
              <h3 className="text-xl font-extrabold text-white">
                Railway Authority API Unresponsive
              </h3>
              <p className="text-xs text-slate-400">
                Bangladesh Railway's public PNR gateway is undergoing scheduled server maintenance.
                Secondary OCR and duplicate integrity checks succeeded. The ticket will undergo
                manual verification.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => alert('Submitting ticket to manual moderator review')}
              >
                Request Manual Moderator Review
              </Button>
            </div>
          </div>
        )}

        {activeEdgeTab === 'NETWORK_ERROR' && (
          <div className="max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <WifiOff className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <Badge variant="danger" size="sm">
                Network Error
              </Badge>
              <h3 className="text-xl font-extrabold text-white">Connection Interrupted</h3>
              <p className="text-xs text-slate-400">
                Unable to reach the Secure Ticket Exchange servers. Please check your internet
                connectivity or firewall settings.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-1.5" /> Reconnect
              </Button>
            </div>
          </div>
        )}

        {activeEdgeTab === 'SESSION_EXPIRED' && (
          <div className="max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <Badge variant="warning" size="sm">
                Security Timeout
              </Badge>
              <h3 className="text-xl font-extrabold text-white">Session Timed Out</h3>
              <p className="text-xs text-slate-400">
                For your financial protection, sessions automatically expire after 30 minutes of
                inactivity. Please authenticate again to access your escrow vault.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="primary" size="sm" onClick={() => (window.location.href = '/login')}>
                Log In Again
              </Button>
            </div>
          </div>
        )}

        {activeEdgeTab === 'UNAUTHORIZED_401' && (
          <div className="max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <Badge variant="danger" size="sm">
                401 Unauthorized
              </Badge>
              <h3 className="text-xl font-extrabold text-white">Authentication Required</h3>
              <p className="text-xs text-slate-400">
                This transaction endpoint requires an authenticated session. Please log in or
                register a verified account.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = '/register')}
              >
                Create Account
              </Button>
              <Button variant="primary" size="sm" onClick={() => (window.location.href = '/login')}>
                Sign In
              </Button>
            </div>
          </div>
        )}

        {activeEdgeTab === 'FORBIDDEN_403' && (
          <div className="max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <Badge variant="warning" size="sm">
                403 Restricted Access
              </Badge>
              <h3 className="text-xl font-extrabold text-white">
                KYC Verification Level 2 Required
              </h3>
              <p className="text-xs text-slate-400">
                To prevent fraud and secondary ticket scalping, listing or reserving digital tickets
                requires completing identity verification (NID or Passport).
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="primary" size="sm" onClick={() => (window.location.href = '/kyc')}>
                Start KYC Verification (2 mins)
              </Button>
            </div>
          </div>
        )}

        {activeEdgeTab === 'SERVER_ERROR_500' && (
          <div className="max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <ServerCrash className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <Badge variant="danger" size="sm">
                500 Internal Error
              </Badge>
              <h3 className="text-xl font-extrabold text-white">Unexpected Service Fault</h3>
              <p className="text-xs text-slate-400">
                Our infrastructure team has been automatically alerted via Inngest telemetry. No
                financial or ticket data has been modified.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[10px] text-slate-400">
              Error Ref: ERR_DB_POOL_TIMEOUT_20261002
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-1.5" /> Reload Page
              </Button>
            </div>
          </div>
        )}

        {activeEdgeTab === 'MANUAL_REVIEW' && (
          <div className="max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <Badge variant="warning" size="sm">
                Manual Review in Progress
              </Badge>
              <h3 className="text-xl font-extrabold text-white">Staff Compliance Review</h3>
              <p className="text-xs text-slate-400">
                Your ticket has been flagged for human verification to guarantee the highest safety
                standard. A trained compliance officer will complete the review within 15 minutes.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              Ticket ID: <strong className="text-white font-mono">AST-8921</strong> • Assigned to:
              Compliance Desk A
            </div>
            <div className="flex justify-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => (window.location.href = '/dashboard')}
              >
                View Dashboard Status
              </Button>
            </div>
          </div>
        )}

        {activeEdgeTab === 'LOADING_PROCESSING' && (
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <Badge variant="blue" size="sm">
                Verification Running
              </Badge>
              <h3 className="text-xl font-extrabold text-white">Analyzing Ticket Cryptography</h3>
              <p className="text-xs text-slate-400">
                Please wait while our distributed OCR nodes process the document format, verify the
                digital seal, and run anti-counterfeit checks.
              </p>
            </div>

            {/* Skeleton visual */}
            <div className="space-y-3 text-left p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <LoadingSkeleton className="h-4 w-3/4" />
              <LoadingSkeleton className="h-3 w-1/2" />
              <LoadingSkeleton className="h-8 w-full rounded-lg" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
