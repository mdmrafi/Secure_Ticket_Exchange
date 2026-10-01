import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const EmailVerificationPage = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { switchRole } = useAuth();
  const navigate = useNavigate();

  const handleInput = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      switchRole('unverified');
      navigate('/dashboard');
    }, 700);
  };

  const handleResend = () => {
    setIsResending(true);
    setTimeout(() => {
      setIsResending(false);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 text-center shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
          <Mail className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Verify Your Email</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            We sent a 6-digit confirmation code to your email address. Enter it below to activate
            your account.
          </p>
        </div>

        {resendSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>New 6-digit verification code dispatched!</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2">
            {code.map((digit, idx) => (
              <input
                key={idx}
                id={`code-${idx}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-12 text-center text-lg font-bold rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
            ))}
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isVerifying}>
            Confirm Email & Continue
          </Button>
        </form>

        <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
          <span>Didn't receive the email?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
            <span>Resend Code</span>
          </button>
        </div>
      </div>
    </div>
  );
};
