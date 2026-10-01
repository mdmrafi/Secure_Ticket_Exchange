import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Menu,
  X,
  User,
  LogOut,
  Bell,
  MessageSquare,
  ShieldAlert,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Sparkles,
  Ticket,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isKycVerified, currentRole, switchRole, logout } =
    useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = isAuthenticated
    ? [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Marketplace', path: '/marketplace' },
        { label: 'My Assets', path: '/my-assets' },
        { label: 'Transactions', path: '/transactions' },
      ]
    : [
        { label: 'Home', path: '/' },
        { label: 'Marketplace', path: '/marketplace' },
        { label: 'How It Works', path: '/how-it-works' },
        { label: 'Security', path: '/security' },
        { label: 'Design System', path: '/design-system' },
      ];

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
      {/* Top Banner: Role Demonstration Switcher */}
      <div className="bg-slate-900/90 border-b border-slate-800/60 px-4 py-1.5 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 font-medium">Platform Principle:</span>
            <span className="text-slate-200 font-semibold italic">"Verify before you trust."</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Prototype Persona:</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 hover:border-slate-600 text-white font-medium text-[11px] cursor-pointer"
              >
                <span className="capitalize">{currentRole.replace('_', ' ')}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div
                  className="absolute right-0 mt-1 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-50 text-xs"
                  onClick={() => setRoleMenuOpen(false)}
                >
                  <button
                    onClick={() => switchRole('user')}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between ${
                      currentRole === 'user' ? 'text-blue-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <span>Verified User (Trader)</span>
                    {currentRole === 'user' && <span>✓</span>}
                  </button>
                  <button
                    onClick={() => switchRole('unverified')}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between ${
                      currentRole === 'unverified' ? 'text-amber-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <span>New User (No KYC)</span>
                    {currentRole === 'unverified' && <span>✓</span>}
                  </button>
                  <button
                    onClick={() => switchRole('admin')}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between ${
                      currentRole === 'admin' ? 'text-purple-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <span>Admin Moderator</span>
                    {currentRole === 'admin' && <span>✓</span>}
                  </button>
                  <button
                    onClick={() => switchRole('guest')}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between ${
                      currentRole === 'guest' ? 'text-slate-100 font-bold' : 'text-slate-400'
                    }`}
                  >
                    <span>Public Guest</span>
                    {currentRole === 'guest' && <span>✓</span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 p-0.5 shadow-md shadow-blue-900/30 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">SECURE</span>
              <span className="font-semibold text-xs text-blue-400 tracking-wider uppercase bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                EXCHANGE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight">
              Verified Digital Ticket Platform
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                isActive(item.path)
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Admin shortcut if admin */}
          {isAdmin && (
            <Link
              to="/admin"
              className={`px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 ${
                isActive('/admin')
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                  : 'text-purple-400 hover:bg-purple-950/30'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Center</span>
            </Link>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Upload/List Action */}
              <Link to="/upload">
                <Button variant="outline" size="sm" icon={PlusCircle}>
                  Upload Asset
                </Button>
              </Link>

              {/* Messaging */}
              <Link
                to="/messages"
                className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
                title="Messages"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-slate-950" />
              </Link>

              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-slate-950" />
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white leading-tight max-w-[90px] truncate">
                      {user?.name}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">
                      {isKycVerified ? '✓ Verified' : '⚠ KYC Needed'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 text-xs space-y-1"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <div className="p-2 border-b border-slate-800">
                      <p className="font-bold text-white text-sm">{user?.name}</p>
                      <p className="text-slate-400 text-[11px] truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile & Security</span>
                    </Link>
                    <Link
                      to="/kyc"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>KYC Verification</span>
                    </Link>
                    <Link
                      to="/edge-states"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>Edge & Error States</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/30 transition text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-purple-950/40 text-purple-300 border border-purple-800/40"
              >
                Admin Center
              </Link>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/upload" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full" icon={PlusCircle}>
                    Upload New Ticket
                  </Button>
                </Link>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" className="w-full" icon={User}>
                    My Profile & Settings
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full text-rose-400" onClick={logout}>
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
