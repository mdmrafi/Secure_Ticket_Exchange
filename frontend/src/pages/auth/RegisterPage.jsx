import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCheck, AlertCircle, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Calculate password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-700' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-blue-500' };
      case 4:
      default:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
    }
  };

  const strength = getPasswordStrength(formData.password);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/email-verification');
    }, 700);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Exchange Account</h2>
          <p className="text-xs text-slate-400">
            Join the verified community for secure digital ticket transfers and escrow.
          </p>
        </div>

        {/* KYC notice requirement banner */}
        <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-blue-300">
            <ShieldCheck className="w-4 h-4" />
            <span>Important Verification Notice</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            To prevent fraud and maintain passenger safety, government identity verification (KYC
            Level 2) will be required before listing tickets or executing high-value reservations.
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
            label="Full Legal Name"
            name="name"
            placeholder="As shown on Government ID"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="you@domain.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              placeholder="+880 1712-345678"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Input
              label="Create Password"
              type="password"
              name="password"
              placeholder="Min. 8 chars (numbers, symbols)"
              value={formData.password}
              onChange={handleChange}
              required
            />

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Password strength:</span>
                  <span className="font-semibold text-white">{strength.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full rounded-full ${
                        step <= strength.score ? strength.color : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="Re-type your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <div className="text-[11px] text-slate-400 leading-relaxed">
            By creating an account, you agree to our{' '}
            <span className="text-blue-400 underline">Terms of Service</span>,{' '}
            <span className="text-blue-400 underline">Anti-Scalping Regulations</span>, and{' '}
            <span className="text-blue-400 underline">Privacy Policy</span>.
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Create Verified Account
          </Button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
