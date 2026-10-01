import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Search,
  ArrowLeft,
  Eye,
  Shield,
  History,
  Lock,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';

export const AdminKycReviewPage = () => {
  const [selectedQueueItem, setSelectedQueueItem] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('BLURRY_DOCUMENT');
  const [auditNotice, setAuditNotice] = useState(null);

  const kycQueue = [
    {
      id: 'KYC-8812',
      user: {
        name: 'Tanvir Hossain',
        email: 'tanvir.hossain@example.com',
        phone: '+880 1711-234567',
        accountAge: '14 days',
        country: 'Bangladesh',
        docType: 'National ID (Smart NID)',
        docNumberRedacted: '•••• •••• 9012',
        submittedAt: 'Today at 09:32 AM',
      },
      extracted: {
        extractedName: 'TANVIR HOSSAIN',
        nameMatchScore: '100% Exact Match',
        extractedDob: '14-AUG-1994',
        extractedId: '8291039012',
        docExpiry: 'N/A (Permanent NID)',
        faceMatchScore: '98.4% Match',
      },
      checks: [
        {
          name: 'Document Readability',
          status: 'Passed',
          detail: 'Optical density meets ISO/IEC 18013 standards.',
        },
        {
          name: 'OCR Field Consistency',
          status: 'Passed',
          detail: 'Bengali/English bilingual transliteration coherent.',
        },
        {
          name: 'National Format Syntax',
          status: 'Passed',
          detail: 'Smart NID 10-digit algorithm checksum valid.',
        },
        {
          name: 'Duplicate Person Check',
          status: 'Passed',
          detail: 'No existing verified account linked to this NID hash.',
        },
      ],
      riskSignals: [
        {
          label: 'Device Fingerprint',
          val: 'Consistent with registration (Chrome 122 on Windows)',
          risk: 'LOW',
        },
        { label: 'Geo-IP Match', val: 'Dhaka, Bangladesh (ISP: Fiber@Home)', risk: 'LOW' },
        { label: 'Known Flagged List', val: 'Clear - No match in fraud databases', risk: 'LOW' },
      ],
      history: [
        { time: '14 days ago', event: 'Account registered with verified email and phone OTP' },
        { time: '2 hours ago', event: 'KYC documents submitted via secure SSL upload' },
        { time: '1 hour ago', event: 'Automated OCR & biometrics pipeline processed successfully' },
      ],
    },
    {
      id: 'KYC-8814',
      user: {
        name: 'Farhana Ahmed',
        email: 'farhana.ahmed@example.com',
        phone: '+880 1819-876543',
        accountAge: '3 days',
        country: 'Bangladesh',
        docType: 'Passport Bio-data Page',
        docNumberRedacted: '•••• 4410',
        submittedAt: 'Today at 10:15 AM',
      },
      extracted: {
        extractedName: 'FARHANA AHMED',
        nameMatchScore: '99% Match',
        extractedDob: '22-NOV-1998',
        extractedId: 'EA0494410',
        docExpiry: '15-DEC-2029',
        faceMatchScore: '89.1% (Low contrast lighting)',
      },
      checks: [
        {
          name: 'Document Readability',
          status: 'Passed',
          detail: 'Machine Readable Zone (MRZ) characters validated.',
        },
        {
          name: 'OCR Field Consistency',
          status: 'Passed',
          detail: 'Passport authority stamp verified.',
        },
        {
          name: 'Duplicate Person Check',
          status: 'Passed',
          detail: 'Zero duplicate records found.',
        },
        {
          name: 'Biometric Confidence',
          status: 'Review',
          detail: 'Lighting glare on selfie photo requires human visual confirmation.',
        },
      ],
      riskSignals: [
        { label: 'Device Fingerprint', val: 'Mobile Safari on iOS (Dhaka)', risk: 'LOW' },
        { label: 'Biometric Variance', val: 'Slight glare over left cheekbone', risk: 'MEDIUM' },
      ],
      history: [
        { time: '3 days ago', event: 'Account created' },
        { time: '35 mins ago', event: 'Passport and selfie uploaded' },
      ],
    },
  ];

  const current = kycQueue[selectedQueueItem] || kycQueue[0];

  const handleApprove = () => {
    setShowApproveModal(false);
    setAuditNotice({
      type: 'APPROVE',
      id: current.id,
      timestamp: new Date().toLocaleTimeString(),
      actor: 'Admin Moderator (You)',
    });
  };

  const handleReject = () => {
    setShowRejectModal(false);
    setAuditNotice({
      type: 'REJECT',
      id: current.id,
      reason: rejectReason,
      timestamp: new Date().toLocaleTimeString(),
      actor: 'Admin Moderator (You)',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
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
            <ShieldCheck className="w-8 h-8 text-blue-500" />
            KYC Identity Verification Queue
          </h1>
          <p className="text-xs text-slate-400">
            Manual compliance review for identity documents, OCR cross-checks, and biometric
            consistency.
          </p>
        </div>

        {/* Audit trail guarantee badge */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3 text-xs text-slate-300">
          <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-white">Immutable Audit Trail Active</p>
            <p className="text-[11px] text-slate-400">
              Every decision is cryptographically signed and logged.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Action Banner when triggered */}
      {auditNotice && (
        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div className="text-xs">
              <span className="font-bold text-white uppercase tracking-wider">
                Audit Event Recorded #{auditNotice.id}:
              </span>{' '}
              <span className="text-slate-300">
                Action: <span className="font-semibold text-emerald-300">{auditNotice.type}</span>{' '}
                by {auditNotice.actor} at {auditNotice.timestamp}.
              </span>
            </div>
          </div>
          <Link to="/admin/audit" className="text-xs text-blue-400 hover:underline">
            View Ledger →
          </Link>
        </div>
      )}

      {/* Main Split Layout: Queue list (1 col) and Detailed Inspector (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Queue List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pending Queue (2)
            </h3>
            <Badge variant="warning" size="sm">
              Awaiting Review
            </Badge>
          </div>

          <div className="space-y-2">
            {kycQueue.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setSelectedQueueItem(index)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedQueueItem === index
                    ? 'bg-blue-600/10 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-slate-400">{item.id}</span>
                  <span className="text-[10px] text-slate-500">{item.user.submittedAt}</span>
                </div>
                <div className="font-bold text-white text-sm">{item.user.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{item.user.docType}</div>
              </button>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-400" /> Compliance Standard
            </div>
            <p>
              In compliance with financial regulations, full identity numbers are strictly redacted.
              Reviewers evaluate document authenticity, photo consistency, and duplicate hashes.
            </p>
          </div>
        </div>

        {/* Right Column: Detailed Document & Verification Inspector */}
        <div className="lg:col-span-3 space-y-6">
          {/* User & Document Metadata Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="blue" size="sm">
                    {current.id}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    Account age: {current.user.accountAge}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-white mt-1">{current.user.name}</h2>
                <p className="text-xs text-slate-400">
                  {current.user.email} • {current.user.phone}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRejectModal(true)}
                  className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                >
                  <XCircle className="w-4 h-4 mr-1.5 text-rose-400" />
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => alert(`Escalated ${current.id} to Senior Compliance Officer.`)}
                >
                  <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-400" />
                  Escalate
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowApproveModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Approve KYC
                </Button>
              </div>
            </div>

            {/* Split Inspection: Document Visuals vs Extracted OCR Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Document Mockup Viewers */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-400" /> Submitted Identity Documents
                </h4>

                {/* Document Card Preview */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-white">{current.user.docType} (Front)</span>
                    <Badge variant="blue" size="sm">
                      High Resolution 300 DPI
                    </Badge>
                  </div>

                  {/* Simulated Secure ID Document Card */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 relative overflow-hidden text-xs">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">
                          PEOPLE'S REPUBLIC OF BANGLADESH
                        </div>
                        <div className="text-[9px] text-slate-400">
                          National Identity Card / জাতীয় পরিচয়পত্র
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-emerald-300">
                        NID
                      </div>
                    </div>

                    <div className="flex gap-3 items-center">
                      <div className="w-16 h-20 rounded bg-slate-700/80 border border-slate-600 flex flex-col items-center justify-center text-[10px] text-slate-400">
                        <UserCheck className="w-6 h-6 text-slate-300 mb-1" />
                        <span>PHOTO</span>
                      </div>
                      <div className="space-y-1 text-slate-200">
                        <p>
                          <span className="text-slate-400 text-[10px]">Name:</span>{' '}
                          <span className="font-bold">{current.extracted.extractedName}</span>
                        </p>
                        <p>
                          <span className="text-slate-400 text-[10px]">DOB:</span>{' '}
                          {current.extracted.extractedDob}
                        </p>
                        <p>
                          <span className="text-slate-400 text-[10px]">NID No:</span>{' '}
                          <span className="font-mono text-emerald-400">
                            {current.user.docNumberRedacted}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Biometric Selfie View */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-white">Biometric Liveness Selfie</span>
                    <span className="text-[11px] text-emerald-400 font-mono font-bold">
                      Face Match: {current.extracted.faceMatchScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-white">Passive Liveness Verified</p>
                      <p className="text-[11px] text-slate-400">
                        Recorded with 3D depth sensors. Anti-spoofing score: 0.994.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extracted Fields & Automated Verification Engine */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Automated Verification
                  Pipeline
                </h4>

                <div className="space-y-2.5">
                  {current.checks.map((check, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{check.name}</span>
                        {check.status === 'Passed' ? (
                          <Badge variant="success" size="sm">
                            ✓ Passed
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            ⚠ Review Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{check.detail}</p>
                    </div>
                  ))}
                </div>

                {/* Risk Signals */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Device & Telemetry Risk Assessment
                  </h5>
                  <div className="space-y-2 text-xs">
                    {current.riskSignals.map((sig, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center py-1 border-b border-slate-800/60 last:border-0"
                      >
                        <div>
                          <span className="text-slate-400 block text-[11px]">{sig.label}</span>
                          <span className="text-white font-medium text-xs">{sig.val}</span>
                        </div>
                        <Badge variant={sig.risk === 'LOW' ? 'success' : 'warning'} size="sm">
                          {sig.risk}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Audit History Timeline for this applicant */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-purple-400" /> Application History
              </h4>
              <div className="space-y-2">
                {current.history.map((h, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap mt-0.5">
                      {h.time}
                    </span>
                    <span className="text-slate-300">{h.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject KYC Submission"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Please choose the regulatory reason for rejecting applicant{' '}
            <strong className="text-white">{current.user.name}</strong>. This explanation will be
            shared securely with the applicant so they can resubmit.
          </p>

          <div className="space-y-2">
            {[
              { id: 'BLURRY_DOCUMENT', label: 'Blurry or illegible document image' },
              { id: 'NAME_MISMATCH', label: 'Name mismatch with registered account' },
              { id: 'EXPIRED_DOCUMENT', label: 'Identity document is past expiration date' },
              { id: 'UNSUPPORTED_TYPE', label: 'Unsupported identity document type' },
              { id: 'SUSPICIOUS_TAMPERING', label: 'Document alteration or tampering detected' },
            ].map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer"
              >
                <input
                  type="radio"
                  name="reject_reason"
                  value={option.id}
                  checked={rejectReason === option.id}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span className="text-slate-200">{option.label}</span>
              </label>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
            Notice: Rejecting this application will be written to the permanent compliance log.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleReject}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Confirm KYC Approval"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            You are approving KYC verification for{' '}
            <strong className="text-white">{current.user.name}</strong> ({current.id}).
          </p>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
            <p className="font-semibold">Verification Privileges Granted:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              <li>Eligible to create verified asset listings.</li>
              <li>Eligible to reserve tickets with protected escrow.</li>
              <li>Verified User badge visible on public marketplace.</li>
            </ul>
          </div>
          <p className="text-[11px] text-slate-400">
            By clicking confirm, an immutable audit event will be recorded with your administrative
            ID.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button variant="success" size="sm" onClick={handleApprove}>
              Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
