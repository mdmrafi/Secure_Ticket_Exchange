import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Ticket, Layers, ArrowLeftRight, CheckCircle2, UserCircle } from 'lucide-react';
import { HealthIndicator } from '../common/HealthIndicator.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navLinks = [
    { name: 'Marketplace', path: '/listings', icon: Ticket },
    { name: 'Verify Asset', path: '/verify', icon: CheckCircle2 },
    { name: 'Escrow & Orders', path: '/escrow', icon: ArrowLeftRight },
    { name: 'Architecture', path: '/architecture', icon: Layers },
    { name: 'Admin', path: '/admin', icon: ShieldCheck },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-300 bg-clip-text text-transparent">
                SafePass
              </span>
              <span className="block text-[10px] text-blue-400 font-medium tracking-wider uppercase">
                Secure Asset Exchange
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 opacity-80" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* System Health & Auth Action */}
          <div className="flex items-center gap-3">
            <HealthIndicator />

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
              <button
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700/60 hover:border-slate-500 transition-all cursor-pointer"
                onClick={() => alert('Authentication module scaffolded. Ready for JWT / Clerk integration.')}
              >
                <UserCircle className="w-3.5 h-3.5" />
                {user ? user.name : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
