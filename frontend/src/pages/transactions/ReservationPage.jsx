import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Lock,
  ShieldCheck,
  Train,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  XCircle,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

export const ReservationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 10:00 atomic reservation countdown timer (600 seconds)
  const [timeLeft, setTimeLeft] = useState(600);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleProceedPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      navigate(`/transaction/TX-10293`);
    }, 900);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      {/* Atomic Reservation Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border-2 border-blue-500/60 shadow-2xl space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mx-auto">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <Badge variant="verified" size="sm">
            Atomic Lock Active
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Reserved for you for {formattedTime}
          </h1>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            This ticket is exclusively locked for your account. No other user can view, reserve, or
            purchase this ticket during this 10-minute escrow reservation window.
          </p>
        </div>

        {/* Live Countdown Clock */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono font-extrabold text-lg">
          <Clock className="w-5 h-5 animate-pulse" />
          <span>{formattedTime} Remaining</span>
        </div>
      </div>

      {/* Reservation Summary Matrix */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
          Reservation & Transaction Summary
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400">Reserved Asset:</span>
            <span className="font-bold text-white">Suborno Express (701) • PNR 89342019</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400">Route & Departure:</span>
            <span className="text-white">Dhaka → Chittagong (Tomorrow, 07:00 AM)</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400">Seat Allocation:</span>
            <span className="text-white">Coach KHA, Seat 18 (Snigdha AC Chair)</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400">Verified Seller:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Rahim Chowdhury (Level 2 KYC)
            </span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-sm">
            <span className="font-bold text-white">Total Amount (Escrow Held):</span>
            <span className="text-xl font-extrabold text-emerald-400">৳805 BDT</span>
          </div>
        </div>

        {/* Escrow Guarantee Explainer */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Buyer Protection Guarantee</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            Your payment is held in neutral third-party escrow. Funds are only transferred to the
            seller once the authorized railway provider confirms successful fulfillment and valid
            ticket possession.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full text-base font-bold shadow-lg shadow-blue-600/30"
            isLoading={isProcessingPayment}
            onClick={handleProceedPayment}
            icon={CreditCard}
          >
            Confirm & Pay via Authoritative Escrow Gateway
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-slate-400 hover:text-rose-400"
            onClick={() => navigate('/marketplace')}
          >
            Cancel Reservation and Release Ticket
          </Button>
        </div>
      </div>
    </div>
  );
};
