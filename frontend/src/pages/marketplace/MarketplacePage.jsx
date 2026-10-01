import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Database,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Badge, VerificationStatusBadge } from '../../components/ui/Badge.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { apiService } from '../../services/api.service.js';

export const MarketplacePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetType, setSelectedAssetType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('departure');
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Fallback initial dataset in case backend is offline
  const fallbackListings = [
    {
      id: 'LST-7019',
      service: 'Suborno Express (701)',
      assetType: 'RAILWAY_TICKET',
      source: 'Dhaka (Kamalapur)',
      destination: 'Chittagong',
      departureDate: '2026-10-14',
      departureTime: '07:00 AM',
      seatClass: 'Snigdha (AC Chair)',
      coachSeat: 'Coach Cha • Seat 14',
      price: 805,
      faceValue: 805,
      sellerName: 'Mahmudur Rahman',
      sellerKyc: 'Level 2 Verified',
      status: 'VERIFIED',
      expiresIn: 'Active Listing',
    },
    {
      id: 'LST-7882',
      service: 'Parabat Express (709)',
      assetType: 'RAILWAY_TICKET',
      source: 'Dhaka (Kamalapur)',
      destination: 'Sylhet',
      departureDate: '2026-10-15',
      departureTime: '06:20 AM',
      seatClass: 'Shovon Chair',
      coachSeat: 'Coach Ka • Seat 22',
      price: 365,
      faceValue: 365,
      sellerName: 'Tanvir Hossain',
      sellerKyc: 'Level 2 Verified',
      status: 'VERIFIED',
      expiresIn: 'Active Listing',
    },
  ];

  const fetchLiveListings = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getListings();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map((item) => {
          const asset = item.assetId || {};
          const meta = asset.metadata || {};
          const seller = item.sellerId || {};
          return {
            id: item._id,
            service:
              asset.title ||
              meta.trainName ||
              meta.operator ||
              meta.eventName ||
              'Verified Transit Asset',
            assetType: asset.assetType || 'RAILWAY_TICKET',
            source: meta.source || meta.fromStation || 'Dhaka',
            destination: meta.destination || meta.toStation || meta.venue || 'Destination',
            departureDate:
              meta.journeyDate || meta.departureDate || meta.eventDate || 'Scheduled Date',
            departureTime: meta.departureTime || meta.doorsOpen || '08:00 AM',
            seatClass: meta.travelClass || meta.class || 'Standard Class',
            coachSeat:
              meta.seat ||
              (meta.coach
                ? `Coach ${meta.coach} • Seat ${meta.seatNumber}`
                : meta.seatNumber || 'Verified Allocation'),
            price: item.askingPrice || item.price,
            faceValue: item.originalFaceValue || item.askingPrice,
            sellerName: seller.name || 'Verified Member',
            sellerKyc: seller.kycStatus === 'VERIFIED' ? 'Level 2 Verified' : 'Under Review',
            status: asset.verificationStatus || 'VERIFIED',
            expiresIn: 'Live Verified',
            isFromBackend: true,
          };
        });
        setListings(mapped);
        setIsLiveConnected(true);
      } else {
        setListings(fallbackListings);
      }
    } catch (err) {
      console.warn('Backend fetch failed, falling back to local dataset:', err.message);
      setListings(fallbackListings);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveListings();
  }, []);

  // Filtering
  const filteredListings = listings.filter((item) => {
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
            {isLiveConnected && (
              <span className="flex items-center gap-1 ml-2 text-[10px] text-blue-400 font-mono">
                <Database className="w-3 h-3" /> Live Backend Connected
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Verified Ticket Exchange
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Browse legitimate digital tickets protected against counterfeit copies, duplicate PNR
            resales, and black-market scalping.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLiveListings}
            title="Refresh listings from MongoDB"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Database
          </Button>
          <Link to="/upload">
            <Button variant="primary" size="sm">
              + List a Verified Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <Input
              type="search"
              placeholder="Search by train name, route (e.g. Dhaka, Chittagong, Sylhet)..."
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
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Verification States</option>
              <option value="VERIFIED">✓ Verified Only</option>
              <option value="NEEDS_REVIEW">⚠ Needs Review</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              Asset Category:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'ALL', label: 'All', icon: Ticket },
                { id: 'RAILWAY_TICKET', label: 'Railway', icon: Train },
                { id: 'BUS_TICKET', label: 'Intercity Bus', icon: Bus },
                { id: 'EVENT_TICKET', label: 'Event Passes', icon: Ticket },
                { id: 'DOCUMENT', label: 'Documents', icon: FileText },
              ].map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedAssetType(category.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                      selectedAssetType === category.id
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-slate-400 text-xs">
            Showing <strong className="text-white">{filteredListings.length}</strong> verified
            listings
          </div>
        </div>
      </div>

      {/* Grid of Ticket Cards */}
      {filteredListings.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No Matching Tickets Found"
          description="Try broadening your route search, clearing specific filters, or check back shortly as sellers upload new verified inventory."
          actionText="Reset All Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedAssetType('ALL');
            setSelectedStatus('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-500/5 flex flex-col justify-between overflow-hidden"
            >
              {/* Card Header & Verification Status */}
              <div className="p-5 border-b border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    {item.assetType === 'RAILWAY_TICKET' && (
                      <Train className="w-3.5 h-3.5 text-blue-400" />
                    )}
                    {item.assetType === 'BUS_TICKET' && (
                      <Bus className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    {item.assetType === 'EVENT_TICKET' && (
                      <Ticket className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    {item.assetType === 'DOCUMENT' && (
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    {item.assetType.replace('_', ' ')}
                  </span>
                  <VerificationStatusBadge status={item.status} size="sm" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition tracking-tight line-clamp-1">
                    {item.service}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">
                      {item.source} → {item.destination}
                    </span>
                  </p>
                </div>
              </div>

              {/* Journey Details & Seats */}
              <div className="p-5 space-y-3 text-xs bg-slate-950/40">
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Date & Time
                  </span>
                  <span className="font-semibold text-slate-200">
                    {item.departureDate} • {item.departureTime}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Class & Allocation</span>
                  <span className="font-semibold text-slate-200">{item.seatClass}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Seat Placement</span>
                  <span className="font-mono text-emerald-400 font-bold">{item.coachSeat}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Seller Trust</span>
                  <div className="text-right">
                    <span className="text-white font-medium block">{item.sellerName}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      {item.sellerKyc}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Action Footer */}
              <div className="p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] text-slate-400">Fixed Transfer Price</div>
                  <div className="text-xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
                    <span>৳{item.price}</span>
                    <span className="text-xs font-normal text-slate-400">BDT</span>
                  </div>
                  {item.price === item.faceValue && (
                    <span className="text-[10px] font-semibold text-emerald-400">
                      Exact Face Value (0% Markup)
                    </span>
                  )}
                </div>

                <Link to={`/asset/${item.id}`}>
                  <Button variant="primary" size="sm">
                    View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
