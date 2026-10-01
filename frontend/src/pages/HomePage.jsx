import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  FileSearch,
  Cpu,
  Lock,
  ArrowRight,
  Train,
  Bus,
  Ticket,
  FileText,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronRight,
  HelpCircle,
  QrCode,
  UserCheck,
  Scale,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Badge, VerificationStatusBadge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';

export const HomePage = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  const verificationPipeline = [
    {
      step: '01',
      title: 'Identity Verification',
      subtitle: 'Biometric & Govt ID KYC',
      desc: 'Sellers and buyers must be authenticated with level-2 identity checks before high-value exchange.',
      icon: UserCheck,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      step: '02',
      title: 'Document & OCR Analysis',
      subtitle: 'Structure & Text Inspection',
      desc: 'Advanced OCR extracts PNR, train number, journey date, coach, seat, and fares while checking PDF tamper signs.',
      icon: FileSearch,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      step: '03',
      title: 'Authenticity Check',
      subtitle: 'Official Registry Validation',
      desc: 'Validates ticket against schedule tables, seat allocation patterns, and official railway verification gateways.',
      icon: Cpu,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      step: '04',
      title: 'Fraud & Duplicate Analysis',
      subtitle: 'Collision & Resell Detection',
      desc: 'Compound index matching prevents a single ticket or PNR from ever being uploaded or sold twice anywhere.',
      icon: ShieldCheck,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      step: '05',
      title: 'Transaction Protection',
      subtitle: 'Atomic Escrow & Transfer',
      desc: '10-minute exclusive reservation locks ticket. Funds are held in escrow until passenger transfer is complete.',
      icon: Lock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  const sampleTickets = [
    {
      id: 'TKT-7019',
      service: 'Suborno Express (701)',
      assetType: 'RAILWAY_TICKET',
      route: 'Dhaka (Kamalapur) → Chittagong',
      date: 'Tomorrow, 07:00 AM',
      seatClass: 'Snigdha (AC Chair)',
      coachSeat: 'KHA-18 (Window)',
      faceValue: 805,
      askingPrice: 805,
      isScalpingProtected: true,
      sellerName: 'Tanvir A.',
      sellerKyc: 'Verified',
      expiresIn: '4h 12m',
      status: 'VERIFIED',
    },
    {
      id: 'TKT-7023',
      service: 'Sonar Bangla Express (788)',
      assetType: 'RAILWAY_TICKET',
      route: 'Chittagong → Dhaka (Kamalapur)',
      date: 'Fri, 04 Oct • 05:00 PM',
      seatClass: 'Shovon Chair',
      coachSeat: 'CHA-42',
      faceValue: 405,
      askingPrice: 405,
      isScalpingProtected: true,
      sellerName: 'Nusrat J.',
      sellerKyc: 'Verified',
      expiresIn: '1d 08h',
      status: 'VERIFIED',
    },
    {
      id: 'TKT-8841',
      service: 'Hanif Enterprise (Scania Multi-Axle)',
      assetType: 'BUS_TICKET',
      route: "Dhaka → Cox's Bazar",
      date: 'Sat, 05 Oct • 10:30 PM',
      seatClass: 'Business Executive Class',
      coachSeat: 'B3',
      faceValue: 1200,
      askingPrice: 1300,
      isScalpingProtected: true,
      sellerName: 'Arif K.',
      sellerKyc: 'Verified',
      expiresIn: '2d 14h',
      status: 'VERIFIED',
    },
  ];

  const faqs = [
    {
      q: 'How does the platform prevent fake or forged PDF tickets?',
      a: 'Every ticket uploaded passes through multi-layer verification: OCR text extraction, layout template matching, PNR checksum analysis, and immediate duplicate detection against our historical database. Tickets that do not pass all checks are flagged and blocked from the marketplace.',
    },
    {
      q: 'What prevents scalpers from marking up ticket prices?',
      a: 'Our strict anti-scalping policy is hardcoded into the transfer policy. Railway tickets cannot be listed above 100% face value (0% markup cap by transport law). Bus and event passes have algorithmic caps (10-20% max), strictly preventing black-market price gouging.',
    },
    {
      q: 'What is an atomic reservation lock?',
      a: 'When a buyer clicks "Reserve", the listing is locked exclusively for that buyer for 10:00 minutes. During this period, no other user can view or purchase the ticket. If payment is completed, escrow holds the funds until transfer is fulfilled; if expired, the lock releases automatically.',
    },
    {
      q: 'Will the platform support other tickets besides trains?',
      a: 'Yes! The platform is built on an extensible plugin architecture with 5 contract interfaces (AssetMetadata, AssetValidator, AssetVerifier, TransferPolicy, TransferProvider). Bus passes, concert tickets, and verified commercial documents are already architected into the system.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 lg:pt-20 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Verify before you trust</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Exchange Digital Tickets{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                With Confidence.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              A secure platform that verifies user identity, extracts ticket data via OCR, checks
              authenticity against duplicates, and protects transactions with atomic escrow.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
              <Link to="/marketplace">
                <Button size="lg" variant="primary" icon={ArrowRight} iconPosition="right">
                  Explore Marketplace
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="secondary">
                  How It Works
                </Button>
              </Link>
            </div>

            {/* Quick security badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Anti-Scalping Price Cap
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Zero-Trust Escrow Payments
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                100% Verified Identifiers
              </span>
            </div>
          </div>

          {/* REALISTIC PRODUCT VISUALIZATION (No cartoon graphics) */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl bg-slate-900/90 border border-slate-700/80 p-6 sm:p-8 shadow-2xl relative">
            <div className="flex flex-wrap items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Train className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Bangladesh Railway E-Ticket Security Pass</span>
                    <VerificationStatusBadge status="VERIFIED" size="sm" />
                  </h3>
                  <p className="text-xs text-slate-400">PNR: 89342019 • Asset ID: AST-RW-7019</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-right">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Escrow Protection
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    Funds Held in Safe Escrow
                  </span>
                </div>
              </div>
            </div>

            {/* Ticket Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Train & Route</span>
                <span className="font-bold text-white text-sm">Suborno Express (701)</span>
                <p className="text-slate-300">Dhaka → Chittagong</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Date & Time</span>
                <span className="font-bold text-white text-sm">Tomorrow • 07:00 AM</span>
                <p className="text-slate-300">Departure Station: Kamalapur</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Seat & Coach</span>
                <span className="font-bold text-white text-sm">Coach KHA, Seat 18</span>
                <p className="text-slate-300">Snigdha (AC Chair)</p>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Face Value & Price</span>
                <span className="font-bold text-emerald-400 text-sm">৳805 BDT</span>
                <p className="text-slate-400 text-[11px]">Strict 0% markup cap applied</p>
              </div>
            </div>

            {/* 6-Point Verification Checklist Strip */}
            <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Identity Verified</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>OCR Validated</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>PNR Checked</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero Duplicate</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Schedule Verified</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Low Risk (Score: 5)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 5-LAYER VERIFICATION PIPELINE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <Badge variant="info">Multi-layer Defense Architecture</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How The Verification Engine Protects You
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Every digital asset must pass five rigorous checkpoints before any exchange or
            reservation can occur.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {verificationPipeline.map((pipe, idx) => {
            const Icon = pipe.icon;
            return (
              <div
                key={idx}
                className="relative rounded-2xl bg-slate-900/80 border border-slate-800 p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center ${pipe.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500">{pipe.step}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1">{pipe.title}</h3>
                  <p className="text-[11px] font-semibold text-blue-400 mb-2">{pipe.subtitle}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{pipe.desc}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Enforced at API Gateway</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. MARKETPLACE PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between mb-8 gap-4">
          <div>
            <Badge variant="verified">Live Exchange</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-2">
              Recently Verified Tickets
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Browse tickets that have passed multi-layer verification and are eligible for
              reservation.
            </p>
          </div>
          <Link to="/marketplace">
            <Button variant="outline" size="sm" icon={ArrowRight} iconPosition="right">
              View All Active Listings
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleTickets.map((tkt) => (
            <Card key={tkt.id} hover className="flex flex-col justify-between">
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">{tkt.id}</span>
                  <VerificationStatusBadge status={tkt.status} size="sm" />
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{tkt.service}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{tkt.route}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Departure</span>
                    <span className="text-slate-200 font-medium">{tkt.date}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Seat & Class</span>
                    <span className="text-slate-200 font-medium">
                      {tkt.coachSeat} • {tkt.seatClass}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Seller Status</span>
                    <span className="text-emerald-400 font-medium">
                      {tkt.sellerName} ({tkt.sellerKyc})
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Asking Price
                  </span>
                  <span className="text-base font-extrabold text-white">
                    ৳{tkt.askingPrice} BDT
                  </span>
                </div>
                <Link to="/marketplace">
                  <Button variant="primary" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 4. EXTENSIBLE ASSET TYPES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <Badge variant="purple">Plugin Architecture</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              One Unified Protocol. Multiple Digital Asset Classes.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              While our initial focus stops fraud in national railway ticketing, our provider
              architecture abstracts validation, verification, transfer policies, and fulfillment
              into generic adapter plugins.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <Train className="w-5 h-5 text-blue-400 mb-2" />
                <h5 className="font-bold text-white text-xs">Railway Tickets</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">0% scalping markup cap</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <Bus className="w-5 h-5 text-emerald-400 mb-2" />
                <h5 className="font-bold text-white text-xs">Intercity Bus</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Dynamic barcode re-issue</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <Ticket className="w-5 h-5 text-purple-400 mb-2" />
                <h5 className="font-bold text-white text-xs">Concert & Events</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Revocation list sync</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <FileText className="w-5 h-5 text-amber-400 mb-2" />
                <h5 className="font-bold text-white text-xs">Legal Documents</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Digital notary deed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10">
          <Badge variant="default">Trust & Transparency</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Everything you need to know about our security and verification protocols.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-bold text-white cursor-pointer hover:bg-slate-800/40"
              >
                <span>{faq.q}</span>
                <ChevronRight
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    activeFaq === idx ? 'rotate-90 text-blue-400' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. FINAL CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-950/40 to-slate-900 border border-blue-500/20 p-8 sm:p-12 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to exchange tickets without the risk of fraud?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Create your account today, verify your identity once, and trade legitimate digital
            tickets with complete peace of mind.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" variant="primary">
                Create Verified Account
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button size="lg" variant="secondary">
                Search Ticket Listings
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
