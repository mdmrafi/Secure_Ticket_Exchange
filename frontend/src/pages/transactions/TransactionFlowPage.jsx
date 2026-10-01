import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  AlertTriangle,
  FileCheck,
  DollarSign,
  Train,
  MessageSquare,
  AlertCircle,
  FileWarning,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Stepper } from '../../components/ui/Stepper.jsx';
import { Modal } from '../../components/ui/Modal.jsx';

export const TransactionFlowPage = () => {
  const { id } = useParams();
  const txId = id || 'TX-10293';
  const navigate = useNavigate();

  // Lifecycle stage: 0=Created, 1=Reserved, 2=Payment Pending, 3=Payment Confirmed, 4=Transfer Processing, 5=Transfer Completed
  const [currentStep, setCurrentStep] = useState(3); // Start at Payment Confirmed for demo
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('INCORRECT_INFORMATION');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);

  const timelineSteps = [
    { title: 'Listing Created', subtitle: 'Verified Asset' },
    { title: 'Reserved', subtitle: 'Atomic Lock' },
    { title: 'Payment Pending', subtitle: 'Gateway Session' },
    { title: 'Payment Confirmed', subtitle: 'Escrow Held' },
    { title: 'Transfer Processing', subtitle: 'Provider Dispatch' },
    { title: 'Transfer Completed', subtitle: 'Ownership Reassigned' },
  ];

  const handleSimulateNextStage = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleFileDispute = (e) => {
    e.preventDefault();
    setDisputeSubmitted(true);
    setTimeout(() => {
      setDisputeModalOpen(false);
      setDisputeSubmitted(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-400">{txId}</span>
            <Badge variant="verified" size="sm">
              Escrow Protected
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Transaction & Escrow Settlement
          </h1>
          <p className="text-xs text-slate-400">
            Suborno Express (701) • PNR: 89342019 • Total Escrow: ৳805 BDT
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/messages">
            <Button variant="secondary" size="sm" icon={MessageSquare}>
              Chat with Seller
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="text-rose-400 hover:text-rose-300 border-rose-500/30"
            onClick={() => setDisputeModalOpen(true)}
            icon={FileWarning}
          >
            Report Dispute
          </Button>
        </div>
      </div>

      {/* 6-Stage Transaction Timeline */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          Transaction State Progression
        </h3>
        <Stepper steps={timelineSteps} currentStep={currentStep} />
      </div>

      {/* Active State Details Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white text-sm">
                  Payment Authoritatively Verified & Confirmed
                </p>
                <p className="text-slate-300 mt-0.5">
                  The payment gateway has confirmed receipt of ৳805 BDT. Funds are locked securely
                  in escrow.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Escrow Balance</span>
                <span className="text-lg font-bold text-emerald-400">৳805.00 BDT</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Status: HELD_IN_ESCROW</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Fulfillment Mode</span>
                <span className="text-sm font-bold text-white">Authorized Transfer</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Railway Adapter Protocol</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Audit Ledger Hash</span>
                <span className="font-mono text-slate-300 text-xs">0x7f9a...88b2</span>
                <p className="text-[11px] text-emerald-400 mt-0.5">✓ Immutable Audit Event</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Next Stage: External transfer provider updates legal attendee possession.
              </span>
              <Button
                variant="primary"
                size="md"
                onClick={handleSimulateNextStage}
                icon={ArrowRight}
                iconPosition="right"
              >
                Simulate: Process Transfer
              </Button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-950/30 border border-blue-500/40">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Clock className="w-6 h-6 animate-spin" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white text-sm">
                  Transfer Processing via Railway Provider
                </p>
                <p className="text-slate-300 mt-0.5">
                  Re-assigning ticket pass and generating verifiable credential for the recipient.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleSimulateNextStage}
              className="w-full"
            >
              Simulate: Complete Transfer & Release Escrow
            </Button>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-5 rounded-xl bg-emerald-950/40 border border-emerald-500/50">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white text-base">Transfer Completed Successfully</p>
                <p className="text-slate-300 mt-0.5">
                  Digital ticket ownership has officially transferred to the buyer. Escrow funds
                  released to seller payout account.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>Transfer Provider ID:</span>
                <span className="text-emerald-400 font-bold">RW-XFER-1790880629</span>
              </div>
              <div className="flex justify-between">
                <span>Asset Status:</span>
                <span className="text-white">TRANSFERRED</span>
              </div>
              <div className="flex justify-between">
                <span>Transaction Status:</span>
                <span className="text-white">COMPLETED</span>
              </div>
              <div className="flex justify-between">
                <span>Escrow Status:</span>
                <span className="text-white">RELEASED</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link to="/marketplace">
                <Button variant="secondary">Browse More Tickets</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="primary">Return to Dashboard</Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Dispute Modal */}
      <Modal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        title="File a Dispute or Suspicion Report"
        description="Every dispute report triggers immediate transaction freezing and an immutable audit event."
      >
        {disputeSubmitted ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">Dispute Filed Successfully</p>
            <p className="text-xs text-slate-400">
              Case #DSP-9921 has been escalated to the platform fraud investigation team.
            </p>
          </div>
        ) : (
          <form onSubmit={handleFileDispute} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Reason for Dispute:</label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
              >
                <option value="SUSPECTED_FAKE_TICKET">Suspected Fake or Inconsistent Ticket</option>
                <option value="INCORRECT_INFORMATION">
                  Incorrect Coach, Seat, or Time Information
                </option>
                <option value="SELLER_UNRESPONSIVE">Seller Unresponsive or Problematic</option>
                <option value="PAYMENT_MISMATCH">Payment / Escrow Mismatch</option>
                <option value="OTHER">Other Reason</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Provide Supporting Details:</label>
              <textarea
                rows={3}
                required
                value={disputeDetails}
                onChange={(e) => setDisputeDetails(e.target.value)}
                placeholder="Explain the specific issue with ticket details, seat number, or passenger record..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300">
              ⚠️ Submitting a dispute will temporarily freeze transaction payouts pending manual
              moderator investigation.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDisputeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger">
                Submit Formal Dispute
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
