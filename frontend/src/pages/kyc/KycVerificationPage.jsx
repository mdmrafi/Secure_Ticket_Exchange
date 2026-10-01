import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  CreditCard,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  ArrowLeft,
  FileText,
  Clock,
  Sparkles,
  Camera,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Badge, VerificationStatusBadge } from '../../components/ui/Badge.jsx';
import { Stepper } from '../../components/ui/Stepper.jsx';

export const KycVerificationPage = () => {
  const { user, isKycVerified, switchRole } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(isKycVerified ? 4 : 0);
  const [docType, setDocType] = useState('NID');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || 'Rahim Chowdhury',
    dob: '1992-08-14',
    nidNumber: '19922692019000124',
    address: 'Gulshan-2, Dhaka, Bangladesh',
  });

  const steps = [
    { title: 'Personal Info', subtitle: 'Legal Identity' },
    { title: 'Document Type', subtitle: 'Select ID' },
    { title: 'Document Upload', subtitle: 'Front & Back Scan' },
    { title: 'Verification Engine', subtitle: 'Multi-layer Analysis' },
    { title: 'Result Status', subtitle: 'Audit Confirmation' },
  ];

  const handleNext = () => {
    if (currentStep === 2) {
      // Simulate live processing
      setCurrentStep(3);
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentStep(4);
        switchRole('user');
      }, 2500);
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Statutory Compliance & Fraud Prevention</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Identity / KYC Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Verify your identity to unlock marketplace listing permissions, atomic reservations, and
          protected escrow payouts.
        </p>
      </div>

      {/* Stepper Progression */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <Stepper steps={steps} currentStep={currentStep} />
      </div>

      {/* Step Content Container */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        {/* STEP 1: Personal Info */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Step 1: Personal Information</h3>
              <p className="text-xs text-slate-400 mt-1">
                Provide legal information matching your official government identity documents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Legal Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
              <Input
                label="Date of Birth"
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                required
              />
            </div>

            <Input
              label="Permanent / Residential Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-300">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Zero Data Exposure Guarantee</span>
              </div>
              <p>
                Your personal identity information is cryptographically encrypted at rest. Ordinary
                marketplace counterparties will only see your verified trader badge.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Document Type */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Step 2: Select Document Type</h3>
              <p className="text-xs text-slate-400 mt-1">
                Choose the official government-issued identity credential you wish to verify.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  id: 'NID',
                  title: 'National ID Card',
                  desc: 'Smart NID or laminated paper card',
                  icon: CreditCard,
                },
                {
                  id: 'PASSPORT',
                  title: 'Machine-Readable Passport',
                  desc: 'Passport bio-data photo page',
                  icon: FileText,
                },
                {
                  id: 'DRIVING_LICENSE',
                  title: 'Smart Driving License',
                  desc: 'BRTA digital smart license card',
                  icon: UserCheck,
                },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setDocType(item.id)}
                  className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 cursor-pointer transition ${
                    docType === item.id
                      ? 'bg-blue-950/30 border-blue-500 shadow-md shadow-blue-500/10'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <item.icon
                    className={`w-6 h-6 ${docType === item.id ? 'text-blue-400' : 'text-slate-400'}`}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  {docType === item.id && (
                    <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                    </span>
                  )}
                </div>
              ))}
            </div>

            <Input
              label={`${docType.replace('_', ' ')} Unique Number`}
              value={formData.nidNumber}
              onChange={(e) => setFormData({ ...formData, nidNumber: e.target.value })}
              required
            />
          </div>
        )}

        {/* STEP 3: Document Upload */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Step 3: Document Upload & Capture</h3>
              <p className="text-xs text-slate-400 mt-1">
                Upload clear color scans or high-resolution photos of your{' '}
                {docType.replace('_', ' ')}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-2xl p-6 text-center space-y-2 bg-slate-950/40 cursor-pointer transition">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                  <Upload className="w-5 h-5 text-blue-400" />
                </div>
                <h5 className="font-bold text-white text-xs">Front Page Scan</h5>
                <p className="text-[11px] text-slate-400">JPG, PNG, or PDF up to 10MB</p>
                <Badge variant="verified" size="sm">
                  ✓ File Attached: nid_front_scan.jpg
                </Badge>
              </div>

              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-2xl p-6 text-center space-y-2 bg-slate-950/40 cursor-pointer transition">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                  <Upload className="w-5 h-5 text-blue-400" />
                </div>
                <h5 className="font-bold text-white text-xs">Back Page Scan</h5>
                <p className="text-[11px] text-slate-400">JPG, PNG, or PDF up to 10MB</p>
                <Badge variant="verified" size="sm">
                  ✓ File Attached: nid_back_scan.jpg
                </Badge>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-bold text-slate-300 block">Quality Checklist:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>All 4 corners of the document must be clearly visible</li>
                <li>No flash glare obstructing document number or name</li>
                <li>Document must be valid and not expired</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 4: Processing State */}
        {currentStep === 3 && (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto animate-pulse">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Analyzing Identity Documents...</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Running automated OCR extraction, hologram security checks, and blacklist collision
                detection.
              </p>
            </div>

            <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2 font-mono text-slate-300">
              <div className="flex items-center justify-between text-emerald-400">
                <span>[1/4] Reading document image:</span>
                <span>COMPLETED</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400">
                <span>[2/4] OCR character extraction:</span>
                <span>MATCH (99.4%)</span>
              </div>
              <div className="flex items-center justify-between text-blue-400 animate-pulse">
                <span>[3/4] Checksum validation:</span>
                <span>IN PROGRESS...</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>[4/4] Generating audit ledger entry:</span>
                <span>QUEUED</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Verification Result */}
        {currentStep === 4 && (
          <div className="py-4 space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-0.5 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-bold text-white">Identity Verification Completed</h3>
                  <Badge variant="verified" size="sm">
                    ✓ Verified Level 2
                  </Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Your identity has been authenticated against national registry standards. You have
                  full listing and exchange access.
                </p>
              </div>
            </div>

            {/* Verification Audit Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Verified Legal Name</span>
                <span className="font-bold text-white">{formData.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Credential Verified</span>
                <span className="font-bold text-white">
                  {docType} •••• {formData.nidNumber.slice(-4)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Verification Issuer</span>
                <span className="font-bold text-white">Official Identity Verification Gateway</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Audit Event ID</span>
                <span className="font-mono text-slate-300">
                  AUD-KYC-{Date.now().toString().slice(-6)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3 pt-2">
              <Button variant="secondary" onClick={() => setCurrentStep(0)}>
                Update Information
              </Button>
              <Button variant="primary" onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        {currentStep < 3 && (
          <div className="flex justify-between pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={handleBack} disabled={currentStep === 0}>
              Back
            </Button>
            <Button variant="primary" onClick={handleNext} icon={ArrowRight} iconPosition="right">
              {currentStep === 2 ? 'Submit for Verification' : 'Continue'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
