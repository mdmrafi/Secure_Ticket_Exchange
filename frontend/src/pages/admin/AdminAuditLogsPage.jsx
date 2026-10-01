import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  Calendar,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';

export const AdminAuditLogsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [resultFilter, setResultFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  const initialLogs = [
    {
      id: 'AUD-99120',
      timestamp: '2026-10-02 03:42:11 UTC',
      actor: 'system.ocr_pipeline',
      role: 'SYSTEM',
      action: 'ASSET_VERIFICATION_COMPLETED',
      resource: 'Asset',
      resourceId: 'AST-9021',
      result: 'SUCCESS',
      ip: '10.0.4.12',
      metadata: {
        engine: 'Tesseract OCR v5.3 + Custom BNR Layout Parser',
        pnr: '7821904123',
        extractedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        confidenceScore: 0.994,
        duplicateMatches: 0,
      },
    },
    {
      id: 'AUD-99119',
      timestamp: '2026-10-02 03:28:44 UTC',
      actor: 'admin.moderator_1',
      role: 'ADMIN',
      action: 'KYC_MANUAL_APPROVAL',
      resource: 'UserKYC',
      resourceId: 'KYC-8812',
      result: 'SUCCESS',
      ip: '103.114.98.2',
      metadata: {
        applicant: 'Tanvir Hossain',
        docType: 'National ID (Smart NID)',
        nidHash: 'b45c...9012',
        reason: 'All optical and MRZ validation passed successfully',
      },
    },
    {
      id: 'AUD-99118',
      timestamp: '2026-10-02 02:51:09 UTC',
      actor: 'payment.escrow_vault',
      role: 'SYSTEM',
      action: 'ESCROW_PAYMENT_CAPTURED',
      resource: 'Transaction',
      resourceId: 'TX-10293',
      result: 'SUCCESS',
      ip: '10.0.2.80',
      metadata: {
        buyerId: 'USR-3041',
        sellerId: 'USR-1092',
        amount: 805,
        currency: 'BDT',
        providerReference: 'BKASH-ESCROW-9912803',
        lockDuration: '3600 seconds',
      },
    },
    {
      id: 'AUD-99117',
      timestamp: '2026-10-02 02:14:32 UTC',
      actor: 'fraud.risk_engine',
      role: 'SYSTEM',
      action: 'LISTING_SUSPICION_ALERT',
      resource: 'Asset',
      resourceId: 'AST-8921',
      result: 'WARNING',
      ip: '10.0.5.21',
      metadata: {
        signal: 'SIG-DUP-01',
        reason: 'Exact SHA256 PDF hash previously uploaded by another user account',
        riskLevel: 'CRITICAL',
        autoSuspension: true,
      },
    },
    {
      id: 'AUD-99116',
      timestamp: '2026-10-02 01:05:19 UTC',
      actor: 'user.buyer_82',
      role: 'USER',
      action: 'RESERVATION_CREATED',
      resource: 'Listing',
      resourceId: 'LST-4402',
      result: 'SUCCESS',
      ip: '118.179.32.14',
      metadata: {
        lockWindow: '10:00 minutes',
        singleBuyerLockAcquired: true,
        expiresAt: '2026-10-02 01:15:19 UTC',
      },
    },
    {
      id: 'AUD-99115',
      timestamp: '2026-10-01 23:44:02 UTC',
      actor: 'auth.guard',
      role: 'SECURITY',
      action: 'LOGIN_FAILED_RATE_LIMIT',
      resource: 'AuthSession',
      resourceId: 'SESSION-UNAUTH',
      result: 'REJECTED',
      ip: '194.26.29.112',
      metadata: {
        failedCount: 5,
        blockedUntil: '2026-10-02 00:44:02 UTC',
        flaggedTorExitNode: true,
      },
    },
  ];

  const filteredLogs = initialLogs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action.includes(actionFilter);
    const matchesResult = resultFilter === 'ALL' || log.result === resultFilter;

    return matchesSearch && matchesAction && matchesResult;
  });

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
            <Lock className="w-8 h-8 text-purple-400" />
            Immutable Audit Ledger
          </h1>
          <p className="text-xs text-slate-400">
            Append-only cryptographic record of all administrative, financial, KYC, and system
            security actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert('Exporting signed CSV audit bundle with SHA-256 digest...')}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export Ledger
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
        <div className="w-full md:w-96">
          <Input
            placeholder="Search by Actor, Action, Resource ID, or Audit ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={Search}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Action Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Category:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Actions</option>
              <option value="VERIFICATION">Verification</option>
              <option value="KYC">KYC Approvals</option>
              <option value="ESCROW">Escrow & Payment</option>
              <option value="RESERVATION">Reservation</option>
              <option value="LOGIN">Auth & Security</option>
            </select>
          </div>

          {/* Result Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Result:</span>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Results</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="WARNING">WARNING</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Audit ID & Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Resource & ID</th>
                <th className="py-3.5 px-4">Result</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-white block">{log.id}</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {log.timestamp}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">{log.actor}</div>
                    <Badge
                      variant={
                        log.role === 'ADMIN'
                          ? 'purple'
                          : log.role === 'SECURITY'
                            ? 'danger'
                            : 'slate'
                      }
                      size="sm"
                      className="mt-0.5"
                    >
                      {log.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-blue-300 font-medium">{log.action}</span>
                    <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                      IP: {log.ip}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-300">{log.resource}:</span>{' '}
                    <span className="font-mono font-bold text-white">{log.resourceId}</span>
                  </td>
                  <td className="py-3 px-4">
                    {log.result === 'SUCCESS' ? (
                      <Badge variant="success" size="sm">
                        SUCCESS
                      </Badge>
                    ) : log.result === 'WARNING' ? (
                      <Badge variant="warning" size="sm">
                        WARNING
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm">
                        REJECTED
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                      className="text-blue-400 hover:text-white"
                    >
                      <Eye className="w-4 h-4 mr-1" /> View JSON
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination & Ledger Stats */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Showing {filteredLogs.length} of 1,294 immutable ledger entries</span>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled>
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <span className="px-3 py-1 font-mono text-white font-bold bg-slate-800 rounded">1</span>
            <Button variant="ghost" size="sm">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* JSON Metadata Inspection Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Payload Inspector — ${selectedLog.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <span className="font-mono text-blue-400 font-bold">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Actor / IP:</span>
                <span className="font-mono text-slate-200">
                  {selectedLog.actor} ({selectedLog.ip})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="font-mono text-slate-200">{selectedLog.timestamp}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2">
                Cryptographic Metadata Payload
              </span>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
