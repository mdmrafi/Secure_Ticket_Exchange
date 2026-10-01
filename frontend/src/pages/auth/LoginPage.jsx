import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both your registered email address and password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.user?.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(res.message || 'Invalid email or password');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickLogin = (quickEmail) => {
    setEmail(quickEmail);
    setPassword('Password123!');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to Exchange</h2>
          <p className="text-xs text-slate-400">
            Access your verified ticket vault, active listings, and protected escrows.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-blue-400 hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Sign In Securely
          </Button>
        </form>

        {/* Quick Test Accounts */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Quick-Fill Seeded Test Accounts:
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => fillQuickLogin('user@safepass.com')}
              className="py-1 px-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-white transition text-center"
            >
              ✓ Verified
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin('unverified@safepass.com')}
              className="py-1 px-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-300 hover:text-white transition text-center"
            >
              ⚠ Unverified
            </button>
            <button
              type="button"
              onClick={() => fillQuickLogin('admin@safepass.com')}
              className="py-1 px-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-white transition text-center"
            >
              🛡 Admin
            </button>
          </div>
          <div className="text-[10px] text-slate-500 text-center">
            Password for all: <code className="text-slate-400 font-mono">Password123!</code>
          </div>
        </div>

        {/* Security Messaging */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Session Protection</span>
          </div>
          <p>Multi-factor verification and IP anomaly protection active for your account safety.</p>
        </div>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 font-semibold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
