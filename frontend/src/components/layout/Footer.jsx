import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, CheckCircle, FileText, ExternalLink } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <span>SECURE EXCHANGE</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              A production-oriented digital asset exchange platform built to prevent counterfeit
              tickets, duplicate sales, and predatory scalping through multi-layer verification.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-layer Verification Active</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Exchange Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/marketplace" className="hover:text-blue-400 transition-colors">
                  Railway Ticket Marketplace
                </Link>
              </li>
              <li>
                <Link to="/upload" className="hover:text-blue-400 transition-colors">
                  Upload & Verify Asset
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-blue-400 transition-colors">
                  How Verification Works
                </Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-blue-400 transition-colors">
                  Anti-Fraud & Scalping Policy
                </Link>
              </li>
              <li>
                <Link to="/design-system" className="hover:text-blue-400 transition-colors">
                  Figma Design System
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Security */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Security & Compliance
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Direct PNR Identity Mutation</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>0% Transport Regulation Price Cap</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>10-Minute Atomic Reservation Lock</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero-Trust Escrow Payments</span>
              </li>
            </ul>
          </div>

          {/* Admin & Edge state references */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Operator Portal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/admin" className="hover:text-purple-400 transition-colors">
                  Admin Moderation Dashboard
                </Link>
              </li>
              <li>
                <Link to="/admin/risk" className="hover:text-purple-400 transition-colors">
                  Fraud & Risk Center
                </Link>
              </li>
              <li>
                <Link to="/admin/audit" className="hover:text-purple-400 transition-colors">
                  Immutable Audit Logs
                </Link>
              </li>
              <li>
                <Link to="/edge-states" className="hover:text-amber-400 transition-colors">
                  System Edge States & Errors
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright and legal note */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© 2026 Secure Digital Ticket Exchange. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-medium">
              Principle: "Verify before you trust."
            </span>
            <span>•</span>
            <span>Production Architecture v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
