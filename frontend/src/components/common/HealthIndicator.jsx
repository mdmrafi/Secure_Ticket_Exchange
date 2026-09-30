import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api.service.js';
import { Activity, Database, Server } from 'lucide-react';

export const HealthIndicator = () => {
  const [health, setHealth] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await apiService.checkHealth();
        setHealth(response.data);
        setIsLive(true);
      } catch (err) {
        setIsLive(false);
        setHealth(null);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const isDbConnected = health?.database?.connected;

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs hover:border-slate-500 transition-all cursor-pointer"
        title="Click to view API & DB Architecture Status"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isLive ? (isDbConnected ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-rose-400'
            }`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isLive ? (isDbConnected ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-rose-500'
            }`}
          ></span>
        </span>
        <span className="font-mono text-slate-300">
          API: {isLive ? (isDbConnected ? 'Online' : 'Degraded') : 'Offline'}
        </span>
      </button>

      {isExpanded && (
        <div className="absolute right-0 mt-2 w-72 p-4 rounded-xl glass-panel shadow-2xl z-50 text-xs border border-slate-700/80">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700/50">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" /> System Diagnostics
            </span>
            <span className="text-[10px] text-slate-400">Auto-refresh 15s</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Server className="w-3 h-3 text-slate-400" /> Backend Core
              </span>
              <span className={isLive ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                {isLive ? '200 OK (v1.0.0)' : 'Unreachable'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Database className="w-3 h-3 text-slate-400" /> MongoDB
              </span>
              <span
                className={
                  isDbConnected
                    ? 'text-emerald-400 font-medium'
                    : health
                    ? 'text-amber-400 font-medium'
                    : 'text-rose-400 font-medium'
                }
              >
                {health?.database?.status || 'Offline'}
              </span>
            </div>

            {health && (
              <>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-500">Uptime</span>
                  <span className="font-mono text-slate-300">{health.uptimeSeconds}s</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Heap Memory</span>
                  <span className="font-mono text-slate-300">{health.system?.memoryUsedMB} MB</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
