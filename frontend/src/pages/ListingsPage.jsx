import React, { useState, useEffect } from 'react';
import { Train, Bus, Ticket, ShieldCheck, Filter, Search, Tag, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge.jsx';

export const ListingsPage = () => {
  const [selectedType, setSelectedType] = useState('ALL');

  // Sample production-mode initial listing structure representing verified assets
  const demoListings = [
    {
      id: 'list_001',
      title: 'Dhaka to Chittagong - Suborno Express',
      type: 'RAILWAY_TICKET',
      categoryIcon: Train,
      journeyDate: '2026-10-15 (07:00 AM)',
      coachSeat: 'Snigdha (AC Chair) - Seat 42',
      pnrHash: 'pnr_hash_98a7***',
      originalFaceValue: 850,
      resalePrice: 850,
      sellerTrustScore: 98,
      status: 'ACTIVE',
      escrowProtected: true,
      antiScalpingVerified: true,
    },
    {
      id: 'list_002',
      title: 'Dhaka to Sylhet - Parabat Express',
      type: 'RAILWAY_TICKET',
      categoryIcon: Train,
      journeyDate: '2026-10-18 (06:20 AM)',
      coachSeat: 'Shovon Chair - Seat 14',
      pnrHash: 'pnr_hash_77c2***',
      originalFaceValue: 395,
      resalePrice: 395,
      sellerTrustScore: 100,
      status: 'ACTIVE',
      escrowProtected: true,
      antiScalpingVerified: true,
    },
    {
      id: 'list_003',
      title: "Dhaka to Cox's Bazar - Hyundai Universe VIP Coach",
      type: 'BUS_TICKET',
      categoryIcon: Bus,
      journeyDate: '2026-10-22 (10:30 PM)',
      coachSeat: 'VIP Sleeper A1',
      pnrHash: 'bus_tkt_44e1***',
      originalFaceValue: 2000,
      resalePrice: 2000,
      sellerTrustScore: 95,
      status: 'ACTIVE',
      escrowProtected: true,
      antiScalpingVerified: true,
    },
  ];

  const filtered =
    selectedType === 'ALL' ? demoListings : demoListings.filter((l) => l.type === selectedType);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Verified Asset Marketplace</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Exchange legitimate tickets at regulated original face value with automated escrow
            security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              alert('Create Listing modal scaffolded. Ready for asset verification hook.')
            }
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer"
          >
            + List an Asset
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pb-2 overflow-x-auto border-b border-slate-800">
        {[
          { label: 'All Assets', value: 'ALL' },
          { label: 'Railway Tickets', value: 'RAILWAY_TICKET' },
          { label: 'Bus Tickets', value: 'BUS_TICKET' },
          { label: 'Event Passes', value: 'EVENT_TICKET' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedType(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              selectedType === tab.value
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => {
          const Icon = item.categoryIcon;
          return (
            <div
              key={item.id}
              className="p-6 rounded-2xl glass-card border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">
                        {item.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-300 font-mono">{item.pnrHash}</span>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white line-clamp-1">{item.title}</h3>
                  <div className="mt-2 text-xs text-slate-400 space-y-1">
                    <p>
                      Schedule:{' '}
                      <span className="text-slate-200 font-medium">{item.journeyDate}</span>
                    </p>
                    <p>
                      Seat: <span className="text-slate-200 font-medium">{item.coachSeat}</span>
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Exchange Price:</span>
                    <span className="text-base font-bold text-emerald-400">
                      ৳{item.resalePrice}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Original Face Value:</span>
                    <span>৳{item.originalFaceValue} (0% Markup)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1 text-blue-400">
                    <ShieldCheck className="w-3.5 h-3.5" /> Escrow Protected
                  </span>
                  <span>Seller Trust: {item.sellerTrustScore}%</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800">
                <button
                  onClick={() =>
                    alert(`Initiating Escrow for ${item.title}. Transaction module active.`)
                  }
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>Request Safe Transfer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
