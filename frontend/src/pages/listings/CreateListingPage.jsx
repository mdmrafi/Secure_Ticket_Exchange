import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Train,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Scale,
  Calendar,
  Clock,
  Lock,
  Check,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Badge, VerificationStatusBadge } from '../../components/ui/Badge.jsx';
import { Stepper } from '../../components/ui/Stepper.jsx';

export const CreateListingPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [askingPrice, setAskingPrice] = useState(805);
  const [priceWarning, setPriceWarning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const faceValue = 805; // Suborno Express BDT

  const steps = [
    { title: 'Select Asset', subtitle: 'Verified Inventory' },
    { title: 'Verification Check', subtitle: 'Compliance Review' },
    { title: 'Set Price', subtitle: 'Anti-Scalping Rule' },
    { title: 'Review Terms', subtitle: 'Seller Agreement' },
    { title: 'Publish', subtitle: 'Go Live' },
  ];

  const handlePriceChange = (val) => {
    const num = Number(val);
    setAskingPrice(num);
    if (num > faceValue) {
      setPriceWarning(
        `Anti-scalping regulation: Railway tickets cannot exceed 100% of original face value (${faceValue} BDT).`
      );
    } else {
      setPriceWarning('');
    }
  };

  const handlePublish = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/marketplace');
    }, 900);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold">
          <Scale className="w-3.5 h-3.5" />
          <span>Transparent Marketplace Listing Protocol</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Ticket Listing</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          List your verified digital ticket on the public exchange with guaranteed anti-scalping
          compliance.
        </p>
      </div>

      {/* Stepper */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <Stepper steps={steps} currentStep={currentStep} />
      </div>

      {/* Wizard Content */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        {/* STEP 1: Select Asset */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Step 1: Select Verified Asset</h3>
              <p className="text-xs text-slate-400 mt-1">
                Choose the digital asset from your verified inventory to list for public exchange.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-blue-950/20 border-2 border-blue-500 space-y-4 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Train className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Suborno Express (701)</h4>
                    <p className="text-xs text-slate-400">PNR: 89342019 • Asset #AST-RW-7019</p>
                  </div>
                </div>
                <VerificationStatusBadge status="VERIFIED" size="sm" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Route</span>
                  <span className="font-semibold text-white">Dhaka → Chittagong</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Journey Date</span>
                  <span className="font-semibold text-white">Tomorrow • 07:00 AM</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Face Value</span>
                  <span className="font-bold text-emerald-400">৳805 BDT</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Review Verification Badges */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Step 2: Review Verification Badges</h3>
              <p className="text-xs text-slate-400 mt-1">
                Confirm all pre-requisite compliance checkpoints are in PASSED status.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">
                  Asset is Fully Eligible for Marketplace
                </span>
                <span className="text-emerald-300">
                  Passed identity, OCR structure, duplicate collision, and timetable schedule
                  checks.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Identity KYC (Seller)</span>
                <Badge variant="verified" size="sm">
                  ✓ Level 2
                </Badge>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Duplicate Check</span>
                <Badge variant="verified" size="sm">
                  ✓ Collision-Free
                </Badge>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">OCR Formatting</span>
                <Badge variant="verified" size="sm">
                  ✓ Authentic
                </Badge>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Timetable Check</span>
                <Badge variant="verified" size="sm">
                  ✓ Schedule Confirmed
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Set Price & Anti-Scalping Policy */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Step 3: Set Asking Price</h3>
              <p className="text-xs text-slate-400 mt-1">
                Our automated transfer policy strictly prohibits markup above official face value on
                railway tickets.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Original Ticket Face Value:</span>
                <span className="font-bold text-white">৳{faceValue} BDT</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Legal Price Ceiling (0% Markup Cap):</span>
                <span className="font-bold text-emerald-400">৳{faceValue} BDT Max</span>
              </div>
            </div>

            <div>
              <Input
                label="Asking Price (in BDT)"
                type="number"
                value={askingPrice}
                onChange={(e) => handlePriceChange(e.target.value)}
                error={priceWarning}
                helperText="You may offer a discount (e.g. ৳750) or list at face value (৳805)."
              />
            </div>

            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-blue-300 block">Why is there a price cap?</span>
              <p>
                In accordance with Bangladesh Railway regulations and platform anti-scalping bylaws,
                tickets cannot be sold for profit. Violations will result in listing suspension and
                user de-verification.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: Terms & Seller Responsibilities */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">
                Step 4: Seller Responsibilities & Terms
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Review your responsibilities during atomic reservation and escrow fulfillment.
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">1. Exclusive Atomic Reservation</span>
                <p>
                  When a verified buyer reserves this listing, it is locked for 10:00 minutes. You
                  may not cancel or tamper with the reservation while payment is pending.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">2. Escrow Payout Guarantee</span>
                <p>
                  Funds will be credited automatically to your payout wallet once passenger transfer
                  confirmation is received from the authorized provider.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">
                  3. Zero Double-Booking Accountability
                </span>
                <p>
                  You agree that attempting to travel using this ticket or claiming a refund
                  directly from the station constitutes fraud and will result in forfeiture of funds
                  and account termination.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Publish Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Step 5: Publish Listing</h3>
              <p className="text-xs text-slate-400 mt-1">
                Confirm your listing summary before making it visible to verified buyers across the
                exchange.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Asset:</span>
                <span className="font-bold text-white">Suborno Express (701) • PNR 89342019</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Route & Time:</span>
                <span className="font-bold text-white">
                  Dhaka → Chittagong (Tomorrow, 07:00 AM)
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Asking Price:</span>
                <span className="font-bold text-emerald-400 text-sm">৳{askingPrice} BDT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Listing Duration:</span>
                <span className="font-bold text-white">Until 2 hours prior to departure</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t border-slate-800">
          <Button
            variant="secondary"
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
            disabled={currentStep === 0 || isSubmitting}
          >
            Back
          </Button>

          {currentStep < 4 ? (
            <Button
              variant="primary"
              disabled={!!priceWarning || askingPrice <= 0}
              onClick={() => setCurrentStep((prev) => Math.min(prev + 1, 4))}
              icon={ArrowRight}
              iconPosition="right"
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={handlePublish}
              isLoading={isSubmitting}
              icon={Check}
              iconPosition="left"
            >
              Publish to Marketplace
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
