import { useState } from 'react';
import { useApi } from '../hooks/useApi';

interface WebhookEvent {
  id: number;
  event_type: string;
  event_id: string;
  employee_id: string;
  employee_name: string;
  company_id: string;
  payload: string;
  severity: string;
  status: string;
  acknowledged_by: string | null;
  processed_at: string | null;
  created_at: string;
  tenant_name: string | null;
}

interface EventStats {
  total: number;
  critical: number;
  unacknowledged: number;
  today: number;
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-900/40 text-red-400 border-red-600/40 animate-pulse',
    warning: 'bg-amber-900/30 text-amber-400 border-amber-600/30',
    info: 'bg-blue-900/30 text-blue-400 border-blue-600/30',
  };
  const icons: Record<string, string> = { critical: '🚨', warning: '⚠️', info: 'ℹ️' };
  return (
    <span className={`text-xs px-2 py-1 rounded border font-medium ${styles[severity] || styles.info}`}>
      {icons[severity] || ''} {severity.toUpperCase()}
    </span>
  );
}

export function EventsPage() {
  const { data: events, refresh } = useApi<WebhookEvent[]>('/api/events', 10000);
  const { data: stats } = useApi<EventStats>('/api/events/stats', 10000);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const acknowledge = async (id: number) => {
    await fetch(`/api/events/${id}/acknowledge`, { method: 'POST', credentials: 'include' });
    refresh();
  };

  const filtered = events?.filter(e => {
    if (filter === 'critical') return e.severity === 'critical';
    if (filter === 'unread') return e.status === 'new';
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🔔 Event Monitor</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time UKG webhook events & DD change alerts</p>
        </div>
        <div className="flex items-center gap-2">
          {stats && stats.critical > 0 && (
            <div className="bg-red-900/30 border border-red-600/30 rounded-lg px-4 py-2 animate-pulse">
              <span className="text-red-400 font-bold text-lg">{stats.critical}</span>
              <span className="text-red-400/70 text-xs ml-1">CRITICAL</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-1">Total Events</p>
          </div>
          <div className="bg-gradient-to-br from-red-900/20 to-red-900/5 border border-red-600/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{stats.critical}</p>
            <p className="text-xs text-red-400/60 mt-1">Critical</p>
          </div>
          <div className="bg-gradient-to-br from-amber-900/20 to-amber-900/5 border border-amber-600/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">{stats.unacknowledged}</p>
            <p className="text-xs text-amber-400/60 mt-1">Unacknowledged</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 border border-cyan-600/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-cyan-400">{stats.today}</p>
            <p className="text-xs text-cyan-400/60 mt-1">Today</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All Events' },
          { key: 'critical', label: '🚨 Critical Only' },
          { key: 'unread', label: '🔴 Unread' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Event List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
            No events to display.
          </div>
        ) : (
          filtered.map(event => (
            <div
              key={event.id}
              className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${
                event.severity === 'critical' && event.status === 'new'
                  ? 'border-red-600/40 shadow-lg shadow-red-900/20'
                  : event.status === 'new'
                  ? 'border-slate-700'
                  : 'border-slate-800 opacity-75'
              }`}
            >
              <div
                className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => setExpanded(expanded === event.id ? null : event.id)}
              >
                {/* Status dot */}
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  event.status === 'new' ? (event.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-blue-500') : 'bg-slate-600'
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <SeverityBadge severity={event.severity} />
                    <span className="text-sm font-semibold">{event.event_type.replace(/_/g, ' ')}</span>
                    {event.status === 'acknowledged' && (
                      <span className="text-xs text-emerald-500">✓ Acknowledged</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>👤 <strong className="text-slate-300">{event.employee_name}</strong></span>
                    <span>ID: {event.employee_id}</span>
                    <span>Company: {event.company_id}</span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-500">{new Date(event.created_at + 'Z').toLocaleString()}</p>
                  <p className="text-xs text-slate-600 mt-1">{event.event_id}</p>
                </div>

                <span className="text-slate-600 text-xs">{expanded === event.id ? '▲' : '▼'}</span>
              </div>

              {/* Expanded Detail */}
              {expanded === event.id && (
                <div className="px-5 pb-4 border-t border-slate-800 pt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-slate-500 mb-2 font-medium">Event Payload</p>
                      <pre className="bg-slate-950 rounded-lg p-4 text-xs font-mono overflow-auto max-h-60">
                        {(() => {
                          try { return JSON.stringify(JSON.parse(event.payload), null, 2); }
                          catch { return event.payload; }
                        })()}
                      </pre>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-2 font-medium">Details</p>
                        {(() => {
                          try {
                            const p = JSON.parse(event.payload);
                            return (
                              <div className="space-y-2">
                                {p.detail && <p className="text-sm text-slate-300">{p.detail}</p>}
                                {p.fields && Object.entries(p.fields).map(([k, v]) => (
                                  <div key={k} className="flex justify-between text-sm">
                                    <span className="text-slate-500">{k}:</span>
                                    <span className="font-mono text-cyan-400">{String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          } catch { return null; }
                        })()}
                      </div>

                      {event.status === 'new' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); acknowledge(event.id); }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full"
                        >
                          ✓ Acknowledge Event
                        </button>
                      )}

                      {event.acknowledged_by && (
                        <p className="text-xs text-slate-500">
                          Acknowledged by <strong>{event.acknowledged_by}</strong> at {event.processed_at}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
