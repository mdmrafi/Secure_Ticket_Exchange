import React, { useState } from 'react';
import {
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { apiService } from '../services/api.service.js';

export const VerifyAssetPage = () => {
  const [pnrInput, setPnrInput] = useState('');
  const [assetType, setAssetType] = useState('RAILWAY_TICKET');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSimulateVerification = (e) => {
    e.preventDefault();
    if (!pnrInput.trim()) return;

    setIsVerifying(true);
    setVerificationResult(null);

    // Simulate multi-tier architecture verification pipeline
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationResult({
        status: 'PASSED',
        confidenceScore: 98,
        pnr: pnrInput,
        checks: [
          { name: 'Format & Checksum Algorithm', passed: true, score: 100 },
          { name: 'Duplicate Listing Registry', passed: true, score: 100 },
          { name: 'PDF Digital Signature Hash', passed: true, score: 95 },
          { name: 'Anti-Scalping Price Match', passed: true, score: 100 },
        ],
        message: 'Ticket authenticity confirmed. Ready for escrow listing.',
      });
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Asset Verification Engine</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Automated fraud detection pipeline verifying railway tickets, bus passes, and legal
          digital assets.
        </p>
      </div>

      <div className="p-8 rounded-2xl glass-card border border-slate-800 space-y-6">
        <form onSubmit={handleSimulateVerification} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Asset Type</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="RAILWAY_TICKET">
                  Railway Ticket (Bangladesh Railway / E-Ticket)
                </option>
                <option value="BUS_TICKET">Intercity Bus Ticket</option>
                <option value="EVENT_TICKET">Event / Concert Pass</option>
                <option value="DOCUMENT">Digital Transferable Document</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Unique Identifier / PNR Number
              </label>
              <input
                type="text"
                placeholder="e.g. 5839201948 or HASH-098"
                value={pnrInput}
                onChange={(e) => setPnrInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="p-8 border-2 border-dashed border-slate-700/80 rounded-2xl text-center space-y-3 bg-slate-950/40">
            <UploadCloud className="w-10 h-10 text-slate-500 mx-auto" />
            <div>
              <span className="text-xs font-semibold text-slate-300 block">
                Upload Official E-Ticket PDF or Pass
              </span>
              <span className="text-[11px] text-slate-500">
                Supports PDF, PNG, JPG (parsed by OCR & Digital Signature Verifier)
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isVerifying || !pnrInput}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-blue-300" />
                <span>Running Inngest Verification Pipeline...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Asset Authenticity</span>
              </>
            )}
          </button>
        </form>

        {verificationResult && (
          <div className="p-5 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-white">Verification Succeeded</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Confidence: {verificationResult.confidenceScore}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {verificationResult.checks.map((chk, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-between"
                >
                  <span className="text-slate-300">{chk.name}</span>
                  <span className="text-emerald-400 font-semibold text-[11px]">
                    PASS ({chk.score}%)
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">{verificationResult.message}</span>
              <button
                onClick={() => alert('Proceeding to create listing for this verified asset.')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition cursor-pointer"
              >
                Proceed to List
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
