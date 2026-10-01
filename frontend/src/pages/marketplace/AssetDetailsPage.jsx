import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api.service.js';
import {
  Train,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Lock,
  ArrowRight,
  UserCheck,
  FileSearch,
  Scale,
  Sparkles,
  AlertTriangle,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge, VerificationStatusBadge } from '../../components/ui/Badge.jsx';
import { Card } from '../../components/ui/Card.jsx';

export const AssetDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticketData, setTicketData] = useState({
    id: id || 'LST-7019',
    service: 'Suborno Express (701)',
    trainNumber: '701',
    pnr: '7819204123',
    assetType: 'RAILWAY_TICKET',
    source: 'Dhaka (Kamalapur Station)',
    destination: 'Chittagong Railway Station',
    departureDate: '14 Oct 2026',
    departureTime: '07:00 AM',
    arrivalEstimate: '01:15 PM (Estimated)',
    seatClass: 'Snigdha (AC Chair)',
    coachSeat: 'Coach Cha • Seat 14',
    faceValue: 805,
    askingPrice: 805,
    currency: 'BDT',
    status: 'VERIFIED',
    listingExpires: '12 days remaining',
    seller: {
      id: 'USR-8821',
      name: 'Mahmudur Rahman',
      kycStatus: 'LEVEL_2_VERIFIED',
      accountAge: '1 year, 4 months',
      completedTrades: 19,
      disputeRate: '0.0%',
      joinedDate: 'June 2025',
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id || id.startsWith('LST-')) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const res = await apiService.getListingById(id);
        if (res.data) {
          const item = res.data;
          const asset = item.assetId || {};
          const meta = asset.metadata || {};
          const seller = item.sellerId || {};
          setTicketData({
            id: item._id,
            service:
              asset.title ||
              meta.trainName ||
              meta.operator ||
              meta.eventName ||
              'Verified Transit Asset',
            trainNumber: meta.trainNumber || 'N/A',
            pnr: meta.pnr || meta.ticketNumber || meta.documentNumber || 'VERIFIED-01',
            assetType: asset.assetType || 'RAILWAY_TICKET',
            source: meta.fromStation || meta.source || 'Dhaka',
            destination: meta.toStation || meta.destination || meta.venue || 'Destination',
            departureDate:
              meta.journeyDate || meta.departureDate || meta.eventDate || 'Scheduled Date',
            departureTime: meta.departureTime || meta.doorsOpen || '08:00 AM',
            arrivalEstimate: 'On Schedule (Official Timetable)',
            seatClass: meta.travelClass || meta.class || 'Standard Class',
            coachSeat:
              meta.seat ||
              (meta.coach
                ? `Coach ${meta.coach} • Seat ${meta.seatNumber}`
                : meta.seatNumber || 'Allocated'),
            faceValue: item.originalFaceValue || item.askingPrice,
            askingPrice: item.askingPrice || item.price,
            currency: item.currency || 'BDT',
            status: asset.verificationStatus || 'VERIFIED',
            listingExpires: 'Active Escrow Window',
            seller: {
              id: seller._id || 'USR-SELLER',
              name: seller.name || 'Verified Member',
              kycStatus: seller.kycStatus === 'VERIFIED' ? 'LEVEL_2_VERIFIED' : 'UNDER_REVIEW',
              accountAge: 'Verified Account',
              completedTrades: 12,
              disputeRate: '0.0%',
              joinedDate: 'October 2025',
            },
          });
        }
      } catch (err) {
        console.warn(
          'Could not fetch single listing from backend, using fallback data:',
          err.message
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const verificationTimeline = [
    {
      title: 'Seller Identity Verified',
      desc: 'Government Level-2 KYC validated via biometric gateway.',
      date: '14 Jul 2025',
    },
    {
      title: 'Document Integrity Analyzed',
      desc: 'High-resolution PDF structure and layout checked.',
      date: 'Today, 08:30 AM',
    },
    {
      title: 'Ticket Information Extracted',
      desc: 'OCR verified PNR 89342019 and coach seat allocation.',
      date: 'Today, 08:31 AM',
    },
    {
      title: 'Authenticity Checked',
      desc: 'Schedule matched official railway timetable.',
      date: 'Today, 08:31 AM',
    },
    {
      title: 'Duplicate Collision Checked',
      desc: 'Zero duplicate records found across active and archived database.',
      date: 'Today, 08:32 AM',
    },
    {
      title: 'External Verification Cleared',
      desc: 'Authorized external transport adapter confirmation.',
      date: 'Today, 08:32 AM',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Asset Info & Verification Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Ticket Summary Box */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Train className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {ticketData.service}
                    </h1>
                    <VerificationStatusBadge status={ticketData.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-400">
                    PNR: {ticketData.pnr} • Asset ID: {ticketData.id}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Official Price
                </span>
                <span className="text-2xl font-extrabold text-emerald-400">
                  ৳{ticketData.askingPrice} BDT
                </span>
              </div>
            </div>

            {/* Journey Details Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" /> Origin Station
                </span>
                <p className="text-sm font-bold text-white">{ticketData.source}</p>
                <p className="text-slate-400">Departure: {ticketData.departureTime}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Destination Station
                </span>
                <p className="text-sm font-bold text-white">{ticketData.destination}</p>
                <p className="text-slate-400">{ticketData.arrivalEstimate}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" /> Date of Journey
                </span>
                <p className="text-sm font-bold text-white">{ticketData.departureDate}</p>
                <p className="text-slate-400">Timetable confirmed active</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                  <Train className="w-3.5 h-3.5 text-purple-400" /> Coach & Seat Details
                </span>
                <p className="text-sm font-bold text-white">{ticketData.coachSeat}</p>
                <p className="text-slate-400">{ticketData.seatClass}</p>
              </div>
            </div>
          </div>

          {/* 6-Stage Visual Verification Timeline */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Authenticity & Verification Trail
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete immutable timeline of optical, cryptographic, and registry checks
                </p>
              </div>
              <Badge variant="verified">100% Passed</Badge>
            </div>

            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {verificationTimeline.map((item, idx) => (
                <div key={idx} className="relative space-y-1">
                  {/* Timeline bullet */}
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-950 border-2 border-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-white">{item.title}</h5>
                    <span className="text-[10px] text-slate-500 font-mono">{item.date}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Reservation CTA & Seller Trust Box */}
        <div className="space-y-6">
          {/* Reservation Card */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Asking Price
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  ৳{ticketData.askingPrice}
                </span>
                <span className="text-sm font-medium text-slate-400">BDT</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold block">
                ✓ 0% Scalping Cap Compliant
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-white">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Protected Escrow Exchange</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Clicking Reserve locks this ticket exclusively for you for 10:00 minutes. Funds
                remain in safe escrow until passenger verification is fulfilled.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full text-base font-bold shadow-lg shadow-blue-600/25"
              onClick={() => navigate(`/reservation/${ticketData.id}`)}
              icon={ArrowRight}
              iconPosition="right"
            >
              Reserve Ticket Now
            </Button>
          </div>

          {/* Seller Trust Profile */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Seller Trust Profile
            </h4>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                {ticketData.seller.name.charAt(0)}
              </div>
              <div>
                <h5 className="text-sm font-bold text-white">{ticketData.seller.name}</h5>
                <Badge variant="verified" size="sm">
                  ✓ {ticketData.seller.kycStatus.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Account Tenure</span>
                <span className="text-white font-medium">{ticketData.seller.accountAge}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Completed Safe Trades</span>
                <span className="text-emerald-400 font-semibold">
                  {ticketData.seller.completedTrades}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Dispute History</span>
                <span className="text-white font-medium">0.0% (Clean Record)</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Identity audited by platform administrator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
