import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Ticket,
  DollarSign,
  Filter,
  CheckCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';

export const NotificationsPage = () => {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      category: 'VERIFICATION',
      title: 'Identity Verification Completed',
      desc: 'Your Level 2 government biometric KYC has been successfully authenticated by the official gateway.',
      time: '10 minutes ago',
      read: false,
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      id: 'n2',
      category: 'LISTING',
      title: 'Your Listing Has Been Reserved',
      desc: 'Verified buyer Tanvir H. has placed an exclusive 10-minute atomic reservation on Suborno Express (701).',
      time: '25 minutes ago',
      read: false,
      icon: Ticket,
      color: 'text-amber-400 bg-amber-500/10',
    },
    {
      id: 'n3',
      category: 'TRANSACTION',
      title: 'Payment Confirmation Received',
      desc: 'The payment gateway has confirmed receipt of ৳805 BDT. Funds are held in escrow under #TX-10293.',
      time: '2 hours ago',
      read: true,
      icon: DollarSign,
      color: 'text-blue-400 bg-blue-500/10',
    },
    {
      id: 'n4',
      category: 'SECURITY',
      title: 'New Login Session Detected',
      desc: 'Successful login detected from IP 103.205.71.14 (Dhaka, Bangladesh). Session encryption active.',
      time: 'Yesterday',
      read: true,
      icon: ShieldAlert,
      color: 'text-purple-400 bg-purple-500/10',
    },
    {
      id: 'n5',
      category: 'SYSTEM',
      title: 'Anti-Scalping Protocol Updated',
      desc: 'Automated 0% markup cap enforcement active for all Bangladesh Railway holiday schedule inventory.',
      time: '2 days ago',
      read: true,
      icon: Bell,
      color: 'text-slate-400 bg-slate-800',
    },
  ]);

  const categories = [
    { id: 'ALL', label: 'All Notifications' },
    { id: 'VERIFICATION', label: 'Verification' },
    { id: 'TRANSACTION', label: 'Transactions' },
    { id: 'LISTING', label: 'Listings' },
    { id: 'SECURITY', label: 'Security' },
    { id: 'SYSTEM', label: 'System' },
  ];

  const filtered = notifications.filter(
    (n) => activeCategory === 'ALL' || n.category === activeCategory
  );

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Notification Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time security alerts, transaction updates, and verification status changes
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={markAllAsRead} icon={CheckCheck}>
          Mark All as Read
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={categories}
        activeTab={activeCategory}
        onChange={setActiveCategory}
        variant="pills"
      />

      {/* Notification Stream */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 divide-y divide-slate-800/80 shadow-xl overflow-hidden">
        {filtered.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`p-5 flex items-start gap-4 transition ${
                !item.read ? 'bg-blue-950/20' : 'hover:bg-slate-800/30'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl border border-slate-700/60 flex items-center justify-center shrink-0 ${item.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" title="Unread" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0 font-medium">
                    {item.time}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
