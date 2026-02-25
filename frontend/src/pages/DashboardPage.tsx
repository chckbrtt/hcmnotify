import { useApi } from '../hooks/useApi';

interface Stats {
  tenants: { total: number; active: number; error: number; pending: number };
  apiCalls: { total: number; today: number };
  recentActivity: any[];
}

function StatCard({ label, value, color = 'blue' }: { label: string; value: string | number; color?: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-600/30 text-blue-400',
    green: 'from-emerald-600/20 to-emerald-600/5 border-emerald-600/30 text-emerald-400',
    red: 'from-red-600/20 to-red-600/5 border-red-600/30 text-red-400',
    orange: 'from-amber-600/20 to-amber-600/5 border-amber-600/30 text-amber-400',
    cyan: 'from-cyan-600/20 to-cyan-600/5 border-cyan-600/30 text-cyan-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-6`}>
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colors[color].split(' ').pop()}`}>{value}</p>
    </div>
  );
}

function actionIcon(action: string): string {
  switch (action) {
    case 'auth_test': return '🔑';
    case 'api_call': return '🔌';
    case 'tenant_created': return '🏢';
    case 'oidc_discovery': return '🔍';
    default: return '📋';
  }
}

export function DashboardPage() {
  const { data: stats, loading } = useApi<Stats>('/api/activity/stats', 30000);

  if (loading || !stats) {
    return <div className="text-slate-500 text-center py-20">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">Dashboard</h2>
        <p className="text-slate-500 text-sm">Platform overview & health</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tenants" value={stats.tenants.total} color="blue" />
        <StatCard label="Active" value={stats.tenants.active} color="green" />
        <StatCard label="Errors" value={stats.tenants.error} color="red" />
        <StatCard label="API Calls Today" value={stats.apiCalls.today} color="cyan" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <a href="/tenants" className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-600/30 transition-colors group">
          <span className="text-2xl">🏢</span>
          <p className="text-sm font-medium mt-2 group-hover:text-blue-400 transition-colors">Add Tenant</p>
        </a>
        <a href="/explorer" className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-cyan-600/30 transition-colors group">
          <span className="text-2xl">🔌</span>
          <p className="text-sm font-medium mt-2 group-hover:text-cyan-400 transition-colors">API Explorer</p>
        </a>
        <a href="/tenants" className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-emerald-600/30 transition-colors group">
          <span className="text-2xl">🔑</span>
          <p className="text-sm font-medium mt-2 group-hover:text-emerald-400 transition-colors">Test Auth</p>
        </a>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="font-semibold">Recent Activity</h3>
        </div>
        {stats.recentActivity.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No activity yet. Add a tenant to get started!
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {stats.recentActivity.map((a: any) => (
              <div key={a.id} className="px-6 py-3 flex items-center gap-4 hover:bg-slate-800/30">
                <span className="text-lg">{actionIcon(a.action)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {a.action.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </p>
                  <p className="text-xs text-slate-500">{a.tenant_name || 'System'}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  a.status === 'success' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'
                }`}>
                  {a.status}
                </span>
                {a.response_ms && (
                  <span className="text-xs text-slate-500">{a.response_ms}ms</span>
                )}
                <span className="text-xs text-slate-600">{new Date(a.created_at + 'Z').toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
