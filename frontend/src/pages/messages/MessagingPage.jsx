import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Paperclip,
  Send,
  ShieldCheck,
  CheckCheck,
  Lock,
  Train,
  Circle,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

export const MessagingPage = () => {
  const [activeChat, setActiveChat] = useState('conv_1');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'seller',
      text: 'Hello! I have confirmed your atomic reservation for Suborno Express Coach KHA Seat 18.',
      time: '10:14 AM',
      read: true,
    },
    {
      id: 'm2',
      sender: 'me',
      text: 'Great! I just submitted the payment to the escrow gateway. Can you confirm the departure time is strictly 07:00 AM?',
      time: '10:16 AM',
      read: true,
    },
    {
      id: 'm3',
      sender: 'seller',
      text: 'Yes, exactly 07:00 AM from Kamalapur Platform 4. The external railway provider is now generating your digital ticket transfer pass.',
      time: '10:17 AM',
      read: true,
    },
  ]);

  const conversations = [
    {
      id: 'conv_1',
      user: 'Rahim C. (Verified Seller)',
      txId: 'TX-10293',
      asset: 'Suborno Express (701)',
      price: '৳805',
      lastMessage: 'Yes, exactly 07:00 AM from Kamalapur...',
      time: '10:17 AM',
      unread: 0,
      online: true,
    },
    {
      id: 'conv_2',
      user: 'Nusrat J. (Verified Seller)',
      txId: 'TX-10280',
      asset: 'Sonar Bangla (788)',
      price: '৳405',
      lastMessage: 'Transfer completed! Safe travels.',
      time: 'Yesterday',
      unread: 0,
      online: false,
    },
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMsg = {
      id: `m_${Date.now()}`,
      sender: 'me',
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };

    setMessages([...messages, newMsg]);
    setMessageInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-[750px] rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-3">
        {/* Left Col: Conversation List */}
        <div className="border-r border-slate-800 flex flex-col bg-slate-950/40">
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span>Encrypted Chat</span>
              </h2>
              <span className="text-[11px] text-slate-400">Escrow Protected</span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setActiveChat(conv.id)}
                className={`p-4 cursor-pointer transition ${
                  activeChat === conv.id
                    ? 'bg-blue-600/10 border-l-4 border-blue-500'
                    : 'hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{conv.user}</span>
                    {conv.online && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">{conv.time}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-blue-400 font-semibold mb-1">
                  <span>#{conv.txId}</span>
                  <span>•</span>
                  <span>{conv.asset}</span>
                </div>

                <p className="text-xs text-slate-400 truncate">{conv.lastMessage}</p>
              </div>
            ))}
          </div>

          {/* Privacy Disclaimer */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Personal phone & payment credentials are concealed for your protection.</span>
          </div>
        </div>

        {/* Right 2 Cols: Active Conversation with Transaction Context Header */}
        <div className="md:col-span-2 flex flex-col justify-between bg-slate-900/60">
          {/* Transaction Context Banner at Top */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Train className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Transaction #TX-10293
                  </span>
                  <Badge variant="verified" size="sm">
                    ✓ Verified Listing
                  </Badge>
                </div>
                <p className="text-sm font-bold text-white">
                  Suborno Express (701) • ৳805 BDT Escrow Held
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Escrow Active
              </span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((msg) => {
              const isMe = msg.sender === 'me';
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 px-1">
                    <span>{msg.time}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-blue-400" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
          >
            <button
              type="button"
              className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Attach verified document"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder="Write a message regarding this transaction..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />

            <Button type="submit" variant="primary" size="sm" icon={Send}>
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
