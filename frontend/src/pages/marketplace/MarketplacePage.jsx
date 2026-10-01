import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Train,
  Bus,
  Ticket,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Badge, VerificationStatusBadge } from '../../components/ui/Badge.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';

export const MarketplacePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetType, setSelectedAssetType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('departure');

  const allListings = [
    {
      id: 'LST-7019',
      service: 'Suborno Express (701)',
      assetType: 'RAILWAY_TICKET',
      source: 'Dhaka (Kamalapur)',
      destination: 'Chittagong',
      departureDate: 'Tomorrow',
      departureTime: '07:00 AM',
      seatClass: 'Snigdha (AC Chair)',
      coachSeat: 'Coach KHA • Seat 18',
      price: 805,
      faceValue: 805,
      sellerName: 'Rahim C.',
      sellerKyc: 'Level 2 Verified',
      status: 'VERIFIED',
      expiresIn: '4h 12m',
    },
    {
      id: 'LST-7882',
      service: 'Sonar Bangla Express (788)',
      assetType: 'RAILWAY_TICKET',
      source: 'Chittagong',
      destination: 'Dhaka (Kamalapur)',
      departureDate: 'Fri, 04 Oct',
      departureTime: '05:00 PM',
      seatClass: 'Shovon Chair',
      coachSeat: 'Coach CHA • Seat 42',
      price: 405,
      faceValue: 405,
      sellerName: 'Nusrat J.',
      sellerKyc: 'Level 2 Verified',
      status: 'VERIFIED',
      expiresIn: '1d 08h',
    },
    {
      id: 'LST-8841',
      service: 'Hanif Enterprise (Scania Multi-Axle)',
      assetType: 'BUS_TICKET',
      source: 'Dhaka',
      destination: "Cox's Bazar",
      departureDate: 'Sat, 05 Oct',
      departureTime: '10:30 PM',
      seatClass: 'Business Executive AC',
      coachSeat: 'Seat B3',
      price: 1300,
      faceValue: 1200,
      sellerName: 'Arif K.',
      sellerKyc: 'Verified',
      status: 'VERIFIED',
      expiresIn: '2d 14h',
    },
    {
      id: 'LST-3301',
      service: 'Parabat Express (709)',
      assetType: 'RAILWAY_TICKET',
      source: 'Dhaka (Airport)',
      destination: 'Sylhet',
      departureDate: 'Sun, 06 Oct',
      departureTime: '06:20 AM',
      seatClass: 'AC Berth',
      coachSeat: 'Coach KHA • Cabin 2',
      price: 1250,
      faceValue: 1250,
      sellerName: 'Mahmud R.',
      sellerKyc: 'Level 2 Verified',
      status: 'VERIFIED',
      expiresIn: '3d 20h',
    },
    {
      id: 'LST-9912',
      service: 'Coldplay: Music of the Spheres Live',
      assetType: 'EVENT_TICKET',
      source: 'Dhaka',
      destination: 'National Stadium',
      departureDate: '10 Oct 2026',
      departureTime: '07:00 PM',
      seatClass: 'VIP Platinum',
      coachSeat: 'Front Stage • Row A Seat 12',
      price: 5500,
      faceValue: 5000,
      sellerName: 'Farhan S.',
      sellerKyc: 'Level 2 Verified',
      status: 'VERIFIED',
      expiresIn: '7d 12h',
    },
    {
      id: 'LST-6623',
      service: 'Apex Corporate Travel Voucher',
      assetType: 'DOCUMENT',
      source: 'Apex Travel Group',
      destination: 'Pan Pacific Sonargaon',
      departureDate: 'Valid till 30 Nov',
      departureTime: 'Open',
      seatClass: 'Corporate Suite Rights',
      coachSeat: 'Deed #DOC-VCH-882',
      price: 2400,
      faceValue: 2500,
      sellerName: 'Saad M.',
      sellerKyc: 'Verified Corporate',
      status: 'VERIFIED',
      expiresIn: '25d',
    },
  ];

  // Filtering
  const filteredListings = allListings.filter((item) => {
    const matchesSearch =
      item.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.destination.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAsset = selectedAssetType === 'ALL' || item.assetType === selectedAssetType;
    const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;

    return matchesSearch && matchesAsset && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Marketplace Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Pre-Verified Digital Inventory</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Verified Ticket Exchange
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Browse legitimate digital tickets protected against counterfeit copies, duplicate PNR
            resales, and black-market scalping.
          </p>
        </div>

        <Link to="/upload">
          <Button variant="primary" size="md">
            + List a Verified Ticket
          </Button>
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <Input
              type="search"
              placeholder="Search by train name, route (e.g. Dhaka, Chittagong)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <select
              value={selectedAssetType}
              onChange={(e) => setSelectedAssetType(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Asset Types</option>
              <option value="RAILWAY_TICKET">Railway Tickets</option>
              <option value="BUS_TICKET">Intercity Bus Passes</option>
              <option value="EVENT_TICKET">Concert & Event Passes</option>
              <option value="DOCUMENT">Verified Legal Documents</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="departure">Sort: Earliest Departure</option>
              <option value="price_low">Sort: Price (Low to High)</option>
              <option value="price_high">Sort: Price (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pill Categories */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'All Assets' },
              { id: 'RAILWAY_TICKET', label: 'Trains Only', icon: Train },
              { id: 'BUS_TICKET', label: 'Buses', icon: Bus },
              { id: 'EVENT_TICKET', label: 'Events', icon: Ticket },
              { id: 'DOCUMENT', label: 'Documents', icon: FileText },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedAssetType(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                  selectedAssetType === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="text-slate-400 text-[11px]">
            Showing <strong className="text-white">{filteredListings.length}</strong> verified
            listings
          </span>
        </div>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <EmptyState
          title="No verified tickets match your criteria"
          description="Try clearing your search query or switching asset categories to see other available listings."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedAssetType('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => (
            <Card key={item.id} hover className="flex flex-col justify-between">
              <div className="p-5 space-y-4">
                {/* Card Top: Asset Badge & Verification Pill */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{item.id}</span>
                    <Badge
                      variant={item.assetType === 'RAILWAY_TICKET' ? 'info' : 'purple'}
                      size="sm"
                    >
                      {item.assetType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <VerificationStatusBadge status={item.status} size="sm" />
                </div>

                {/* Service Name & Route */}
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                    {item.service}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>
                      {item.source} → {item.destination}
                    </span>
                  </div>
                </div>

                {/* Journey & Seat Matrix */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Journey Date
                    </span>
                    <span className="text-white font-semibold">
                      {item.departureDate} • {item.departureTime}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Seat / Coach</span>
                    <span className="text-slate-200 font-medium">
                      {item.coachSeat} ({item.seatClass})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Seller Verification</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {item.sellerName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Price & CTA */}
              <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Price
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-extrabold text-emerald-400">৳{item.price}</span>
                    <span className="text-xs text-slate-400 font-medium">BDT</span>
                  </div>
                </div>

                <Link to={`/asset/${item.id}`}>
                  <Button variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                    View Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
