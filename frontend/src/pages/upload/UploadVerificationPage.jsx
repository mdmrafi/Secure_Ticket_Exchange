import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Train,
  Lock,
  Layers,
  FileCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge, VerificationStatusBadge } from '../../components/ui/Badge.jsx';
import { Card } from '../../components/ui/Card.jsx';

export const UploadVerificationPage = () => {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('UPLOAD'); // UPLOAD -> PROCESSING -> RESULT
  const [processStage, setProcessStage] = useState(0);
  const [expandedChecks, setExpandedChecks] = useState({});
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const navigate = useNavigate();

  const stages = [
    'Uploading document file...',
    'Reading image structure & headers...',
    'Extracting PNR, train number, and coach/seat via OCR...',
    'Checking document consistency against Bangladesh Railway formats...',
    'Scanning global database for duplicate tickets or collision...',
    'Performing external verification with railway adapter...',
    'Generating comprehensive verification assessment...',
  ];

  const handleFileDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (dropped) {
      setFile(dropped);
    }
  };

  const startVerification = () => {
    if (!file) return;
    setStep('PROCESSING');
    setProcessStage(0);

    // Sequence stages smoothly
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setProcessStage(current);
      if (current >= stages.length - 1) {
        clearInterval(interval);
        setTimeout(() => {
          setStep('RESULT');
        }, 1200);
      }
    }, 600);
  };

  const toggleCheck = (id) => {
    setExpandedChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const verificationChecks = [
    {
      id: 'identity',
      title: 'Identity Verification',
      status: 'PASSED',
      summary: 'Seller identity verified against national credentials (Level 2).',
      details:
        'Account owner Rahim Chowdhury holds verified Level-2 KYC status matching the passenger booking origin.',
    },
    {
      id: 'readability',
      title: 'Document Readability',
      status: 'PASSED',
      summary: 'High contrast document, 100% legibility on all essential fields.',
      details:
        'All required optical security zones, barcodes, and passenger fields have zero degradation or pixel distortion.',
    },
    {
      id: 'ocr',
      title: 'OCR Consistency',
      status: 'PASSED',
      summary: 'Document structure is consistent with expected ticket information.',
      details:
        'OCR extracted: PNR 89342019, Suborno Express 701, Coach KHA Seat 18. Values match structural formatting tables.',
    },
    {
      id: 'format',
      title: 'Ticket Format Integrity',
      status: 'PASSED',
      summary: 'Official Bangladesh Railway e-ticket digital template verified.',
      details:
        'Digital watermarks, timestamp syntax, and standard government transport fonts strictly match genuine issued templates.',
    },
    {
      id: 'duplicate',
      title: 'Duplicate Collision Detection',
      status: 'PASSED',
      summary: 'Zero duplicate records found across all active listings and archives.',
      details:
        'Compound index on (assetType, uniqueAssetIdentifier) confirms this ticket has never been listed or transferred before.',
    },
    {
      id: 'external',
      title: 'External Verification',
      status: 'PASSED',
      summary: 'Schedule and route match official rail timetable.',
      details:
        'Official timetable confirms Suborno Express 701 operates Dhaka to Chittagong on the scheduled departure date.',
    },
    {
      id: 'risk',
      title: 'Risk Analysis',
      status: 'PASSED',
      summary: 'Assessed as Low Risk (Score: 4 / 100).',
      details:
        'Zero risk signals detected. Seller has 19 completed safe trades with zero disputed transactions.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Multi-layer Verification Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Upload & Verify Ticket
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Upload your digital ticket file to extract journey information and run multi-layer
          verification checks before listing.
        </p>
      </div>

      {/* STATE 1: UPLOAD STATE */}
      {step === 'UPLOAD' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-10 space-y-6 shadow-xl">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-8 sm:p-12 text-center space-y-4 bg-slate-950/40 transition cursor-pointer"
          >
            <input
              type="file"
              id="ticket-upload"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileDrop}
            />
            <label htmlFor="ticket-upload" className="cursor-pointer space-y-3 block">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-bold text-white">
                  {file ? file.name : 'Click to select or drag and drop your ticket'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supported formats: PDF, JPG, PNG (Maximum file size: 10MB)
                </p>
              </div>
            </label>

            {file && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}
          </div>

          {/* Privacy and Security Notice */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Strict Privacy & Integrity Guarantee</span>
            </div>
            <p>
              Uploaded tickets are processed through automated OCR and hash validation. Personal
              phone numbers or sensitive identity details are never exposed to prospective buyers on
              the marketplace.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="lg"
              disabled={!file}
              onClick={startVerification}
              icon={ArrowRight}
              iconPosition="right"
            >
              Start Multi-layer Verification
            </Button>
          </div>
        </div>
      )}

      {/* STATE 2: PROCESSING STATE */}
      {step === 'PROCESSING' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 sm:p-12 text-center space-y-8 shadow-xl">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 rounded-full bg-blue-600/10 border-2 border-blue-500/30 flex items-center justify-center text-blue-400 animate-pulse">
              <RefreshCw className="w-10 h-10 animate-spin text-blue-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Analyzing Ticket Integrity...</h3>
            <p className="text-sm text-blue-400 font-medium">{stages[processStage]}</p>
          </div>

          {/* Real-time Stage Progression */}
          <div className="max-w-md mx-auto space-y-2 text-left text-xs font-mono">
            {stages.map((stg, idx) => {
              const isDone = idx < processStage;
              const isCurr = idx === processStage;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                    isDone
                      ? 'text-emerald-400 bg-emerald-950/20'
                      : isCurr
                        ? 'text-blue-400 bg-blue-950/30 animate-pulse'
                        : 'text-slate-600'
                  }`}
                >
                  <span className="truncate pr-2">{stg}</span>
                  <span className="shrink-0 font-bold">
                    {isDone ? '✓ PASS' : isCurr ? 'RUNNING...' : 'PENDING'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STATE 3: COMPREHENSIVE VERIFICATION RESULT REPORT */}
      {step === 'RESULT' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-blue-950/40 border border-emerald-500/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Verification Result
                    </h2>
                    <Badge variant="verified" size="sm">
                      ✓ Verified Asset
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    This ticket has successfully satisfied all structural, optical, schedule, and
                    duplicate fraud checks.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Fraud Risk
                </span>
                <span className="text-sm font-extrabold text-emerald-400">LOW RISK (Score: 4)</span>
              </div>
            </div>

            {/* Extracted Ticket Overview Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Service & Route</span>
                <span className="font-bold text-white">Suborno Express (701)</span>
                <p className="text-slate-300">Dhaka → Chittagong</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Journey Date</span>
                <span className="font-bold text-white">Tomorrow, 07:00 AM</span>
                <p className="text-slate-300">Kamalapur Station</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Coach & Seat</span>
                <span className="font-bold text-white">Coach KHA • Seat 18</span>
                <p className="text-slate-300">Snigdha (AC Chair)</p>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Official Face Value</span>
                <span className="font-bold text-emerald-400 text-sm">৳805 BDT</span>
                <p className="text-slate-400 text-[10px]">Anti-scalping cap applies</p>
              </div>
            </div>
          </div>

          {/* Individual Checks (Expandable) */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white">Verification Engine Checkpoints</h3>

            <div className="space-y-2.5">
              {verificationChecks.map((chk) => {
                const isOpen = expandedChecks[chk.id];
                return (
                  <div
                    key={chk.id}
                    className="rounded-xl bg-slate-950/50 border border-slate-800/80 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCheck(chk.id)}
                      className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold cursor-pointer hover:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-white text-sm block font-bold">{chk.title}</span>
                          <span className="text-slate-400 text-xs font-normal">{chk.summary}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          PASSED
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-3.5 pt-1 text-xs text-slate-300 border-t border-slate-800/60 leading-relaxed bg-slate-900/40">
                        {chk.details}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Technical Details Toggle (for advanced/admin users) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>
                  {showTechnicalDetails
                    ? 'Hide Technical Details'
                    : 'View Technical Details (JSON Payload)'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`}
                />
              </button>

              {showTechnicalDetails && (
                <pre className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  {JSON.stringify(
                    {
                      assetIdentifier: 'AST-RW-89342019',
                      assetType: 'RAILWAY_TICKET',
                      extractedData: {
                        pnr: '89342019',
                        trainNo: '701',
                        trainName: 'Suborno Express',
                        source: 'Dhaka',
                        destination: 'Chittagong',
                        coach: 'KHA',
                        seat: '18',
                        fare: 805,
                        currency: 'BDT',
                      },
                      verificationEngine: {
                        ocrMatch: true,
                        checksumValid: true,
                        duplicateDetected: false,
                        fraudScore: 4,
                        riskLevel: 'LOW',
                        notarySignature: 'sha256:7b91c28f9d0e12a4b87c...',
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <Button variant="secondary" onClick={() => setStep('UPLOAD')}>
              Verify Another File
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/create-listing')}
            >
              Proceed to Create Listing
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
