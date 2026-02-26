import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

interface Tenant {
  id: string;
  name: string;
  company_short: string;
  company_id: string | null;
  status: string;
  last_auth_test: string | null;
}

interface WebhookEvent {
  id: number;
  event_type: string;
  employee_name: string;
  employee_id: string;
  company_id: string;
  severity: string;
  status: string;
  payload: string;
  created_at: string;
}

interface EventStats {
  total: number;
  critical: number;
  unacknowledged: number;
  today: number;
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-900/40 text-red-400 border-red-600/40',
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

export function ClientPortalPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { data: tenant } = useApi<Tenant>(tenantId ? `/api/tenants/${tenantId}` : '');
  const { data: events, refresh: refreshEvents } = useApi<WebhookEvent[]>(
    tenantId ? `/api/events?tenantId=${tenantId}` : '', 10000
  );
  const { data: allEvents } = useApi<WebhookEvent[]>('/api/events', 10000);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Filter events for this tenant's company_id (since tenant_id might not be set on seeded data)
  const tenantEvents = (allEvents || []).filter(e => 
    tenant && (e.company_id === tenant.company_id || e.company_id === tenant.company_short)
  );

  const stats = {
    total: tenantEvents.length,
    critical: tenantEvents.filter(e => e.severity === 'critical').length,
    unacknowledged: tenantEvents.filter(e => e.status === 'new').length,
    today: tenantEvents.filter(e => {
      const d = new Date(e.created_at + 'Z');
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
  };

  const acknowledge = async (id: number) => {
    await fetch(`/api/events/${id}/acknowledge`, { method: 'POST', credentials: 'include' });
    refreshEvents();
  };

  if (!tenant) {
    return <div className="text-slate-500 text-center py-20">Loading client portal...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Client Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/tenants')} className="text-slate-500 hover:text-slate-300 text-sm">
              ← Admin
            </button>
            <div className="w-px h-6 bg-slate-700" />
            <div>
              <h1 className="text-xl font-bold">
                <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">HCM</span>
                <span className="text-white">Notify</span>
              </h1>
            </div>
            <div className="w-px h-6 bg-slate-700" />
            <div>
              <p className="font-semibold">{tenant.name}</p>
              <p className="text-xs text-slate-500">{tenant.company_short} {tenant.company_id ? `· ${tenant.company_id}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              tenant.status === 'active' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-600/30' :
              'bg-slate-700 text-slate-400 border border-slate-600'
            }`}>
              {tenant.status === 'active' ? '🟢 Connected' : '⏳ ' + tenant.status}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Critical Alert Banner */}
        {stats.critical > 0 && (
          <div className="bg-gradient-to-r from-red-900/40 to-red-900/10 border border-red-600/40 rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🚨</span>
              <div>
                <p className="font-bold text-red-400 text-xl">
                  {stats.critical} Critical Direct Deposit Alert{stats.critical > 1 ? 's' : ''}
                </p>
                <p className="text-red-400/70 text-sm mt-1">
                  Immediate review required — potential unauthorized payroll changes detected
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-1">Total Events</p>
          </div>
          <div className="bg-gradient-to-br from-red-900/20 to-red-900/5 border border-red-600/20 rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-red-400">{stats.critical}</p>
            <p className="text-xs text-red-400/60 mt-1">Critical Alerts</p>
          </div>
          <div className="bg-gradient-to-br from-amber-900/20 to-amber-900/5 border border-amber-600/20 rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-amber-400">{stats.unacknowledged}</p>
            <p className="text-xs text-amber-400/60 mt-1">Pending Review</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/5 border border-emerald-600/20 rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-emerald-400">{stats.total - stats.unacknowledged}</p>
            <p className="text-xs text-emerald-400/60 mt-1">Reviewed</p>
          </div>
        </div>

        {/* Event Feed */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Events</h2>
          <div className="space-y-3">
            {tenantEvents.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                <span className="text-4xl">✅</span>
                <p className="text-slate-400 mt-3">No events detected. All clear!</p>
              </div>
            ) : (
              tenantEvents.map(event => (
                <div
                  key={event.id}
                  className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${
                    event.severity === 'critical' && event.status === 'new'
                      ? 'border-red-600/40 shadow-lg shadow-red-900/20'
                      : event.status === 'new' ? 'border-slate-700' : 'border-slate-800 opacity-70'
                  }`}
                >
                  <div
                    className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
                    onClick={() => setExpanded(expanded === event.id ? null : event.id)}
                  >
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      event.status === 'new' 
                        ? event.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                        : 'bg-slate-600'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <SeverityBadge severity={event.severity} />
                        <span className="text-sm font-semibold">
                          {event.event_type === 'ACCOUNT_UPDATED' ? 'Direct Deposit Changed' :
                           event.event_type === 'ACCOUNT_CREATED' ? 'New Direct Deposit Added' :
                           event.event_type.replace(/_/g, ' ')}
                        </span>
                        {event.status === 'acknowledged' && (
                          <span className="text-xs text-emerald-500">✓ Reviewed</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">
                        Employee: <strong className="text-slate-300">{event.employee_name}</strong>
                        <span className="text-slate-600 ml-2">ID: {event.employee_id}</span>
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-500">
                        {new Date(event.created_at + 'Z').toLocaleString()}
                      </p>
                    </div>
                    <span className="text-slate-600">{expanded === event.id ? '▲' : '▼'}</span>
                  </div>

                  {expanded === event.id && (
                    <div className="px-5 pb-5 border-t border-slate-800 pt-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-slate-500 mb-3 font-medium uppercase">Change Details</p>
                          {(() => {
                            try {
                              const p = JSON.parse(event.payload);
                              return (
                                <div className="space-y-3">
                                  {p.detail && (
                                    <p className="text-sm text-slate-300 bg-slate-800/50 rounded-lg p-3">{p.detail}</p>
                                  )}
                                  {p.fields && Object.entries(p.fields).map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center bg-slate-800/30 rounded-lg px-4 py-2.5">
                                      <span className="text-sm text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                      <span className="font-mono text-sm text-cyan-400 font-medium">{String(v)}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            } catch { return <pre className="text-xs text-slate-400">{event.payload}</pre>; }
                          })()}
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-3 font-medium uppercase">Recommended Action</p>
                            {event.severity === 'critical' ? (
                              <div className="bg-red-900/10 border border-red-600/20 rounded-lg p-4">
                                <p className="text-sm text-red-400 font-medium">⚠️ Immediate Review Required</p>
                                <ul className="text-xs text-slate-400 mt-2 space-y-1 list-disc list-inside">
                                  <li>Verify change with employee directly</li>
                                  <li>Cross-reference with HR/payroll records</li>
                                  <li>Place payroll hold if unverified within 24hrs</li>
                                  <li>Document verification in case notes</li>
                                </ul>
                              </div>
                            ) : (
                              <div className="bg-amber-900/10 border border-amber-600/20 rounded-lg p-4">
                                <p className="text-sm text-amber-400 font-medium">📋 Standard Review</p>
                                <p className="text-xs text-slate-400 mt-1">Verify during next payroll cycle review.</p>
                              </div>
                            )}
                          </div>
                          {event.status === 'new' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); acknowledge(event.id); }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors w-full"
                            >
                              ✓ Mark as Reviewed
                            </button>
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

        {/* Footer */}
        <div className="text-center text-xs text-slate-600 pt-8 border-t border-slate-800">
          <p>Powered by <strong>HCMNotify</strong> · Real-time UKG Ready Monitoring · CPB3 Tech LLC</p>
        </div>
      </div>
    </div>
  );
}
