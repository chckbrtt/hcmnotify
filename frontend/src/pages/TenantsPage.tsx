import { useState } from 'react';
import { useApi } from '../hooks/useApi';

interface Tenant {
  id: string;
  name: string;
  company_short: string;
  company_id: string | null;
  base_url: string;
  username: string;
  status: string;
  last_auth_test: string | null;
  last_error: string | null;
}

interface AuthResult {
  success: boolean;
  token?: string;
  decoded?: any;
  error?: string;
  responseMs: number;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-900/30 text-emerald-400 border-emerald-600/30',
    error: 'bg-red-900/30 text-red-400 border-red-600/30',
    pending: 'bg-slate-700/30 text-slate-400 border-slate-600/30',
    inactive: 'bg-slate-800 text-slate-500 border-slate-700',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded border ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

export function TenantsPage() {
  const { data: tenants, loading, refresh } = useApi<Tenant[]>('/api/tenants');
  const [showModal, setShowModal] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [authResult, setAuthResult] = useState<{ tenantId: string; result: AuthResult } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '', company_short: '', base_url: 'https://secure2.saashr.com/ta/rest',
    api_key: '', username: '', password: '',
  });

  const openCreate = () => {
    setEditTenant(null);
    setForm({ name: '', company_short: '', base_url: 'https://secure2.saashr.com/ta/rest', api_key: '', username: '', password: '' });
    setShowModal(true);
  };

  const openEdit = (t: Tenant) => {
    setEditTenant(t);
    setForm({ name: t.name, company_short: t.company_short, base_url: t.base_url, api_key: '', username: t.username, password: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    const body = { ...form };
    // Don't send empty credential fields on edit (keep existing)
    if (editTenant) {
      if (!body.api_key) delete (body as any).api_key;
      if (!body.password) delete (body as any).password;
    }

    const res = await fetch(editTenant ? `/api/tenants/${editTenant.id}` : '/api/tenants', {
      method: editTenant ? 'PUT' : 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowModal(false);
      refresh();
    }
  };

  const testAuth = async (tenantId: string) => {
    setTesting(tenantId);
    setAuthResult(null);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/test-auth`, {
        method: 'POST', credentials: 'include',
      });
      const result = await res.json();
      setAuthResult({ tenantId, result });
      refresh();
    } finally {
      setTesting(null);
    }
  };

  const runDiscovery = async (tenantId: string) => {
    const res = await fetch(`/api/tenants/${tenantId}/discover`, {
      method: 'POST', credentials: 'include',
    });
    const result = await res.json();
    alert(result.success ? 'OIDC Discovery successful! Endpoints saved.' : `Discovery failed: ${result.error}`);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🏢 Tenant Manager</h2>
          <p className="text-slate-500 text-sm mt-1">Manage UKG Ready tenant connections</p>
        </div>
        <button onClick={openCreate} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all">
          + Add Tenant
        </button>
      </div>

      {/* Auth Test Result */}
      {authResult && (
        <div className={`rounded-xl p-5 border ${authResult.result.success ? 'bg-emerald-900/20 border-emerald-600/30' : 'bg-red-900/20 border-red-600/30'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${authResult.result.success ? 'text-emerald-400' : 'text-red-400'}`}>
              {authResult.result.success ? '🟢 Authentication Successful' : '🔴 Authentication Failed'}
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{authResult.result.responseMs}ms</span>
              <button onClick={() => setAuthResult(null)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>
          </div>

          {authResult.result.success && authResult.result.decoded && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-1">Company ID</p>
                <p className="font-mono text-cyan-400">{authResult.result.decoded.cid}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Subject</p>
                <p className="font-mono">{authResult.result.decoded.sub}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Issued</p>
                <p className="font-mono text-xs">{new Date(authResult.result.decoded.iat * 1000).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Expires</p>
                <p className="font-mono text-xs">{new Date(authResult.result.decoded.exp * 1000).toLocaleString()}</p>
              </div>
            </div>
          )}

          {authResult.result.success && authResult.result.token && (
            <div className="mt-3">
              <p className="text-slate-500 text-xs mb-1">Token</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-slate-400 bg-slate-800 rounded px-3 py-2 truncate flex-1">{authResult.result.token}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(authResult.result.token!)}
                  className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          )}

          {authResult.result.error && (
            <p className="text-red-400 text-sm mt-2">{authResult.result.error}</p>
          )}
        </div>
      )}

      {/* Tenant Table */}
      {loading ? (
        <div className="text-slate-500 text-center py-20">Loading tenants...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {tenants && tenants.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Tenant</th>
                  <th className="px-5 py-3 text-left">Company</th>
                  <th className="px-5 py-3 text-left">Base URL</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-left">Last Test</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tenants.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-medium">{t.name}</td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">{t.company_short}{t.company_id ? ` (${t.company_id})` : ''}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs truncate max-w-xs">{t.base_url}</td>
                    <td className="px-5 py-4 text-center"><StatusBadge status={t.status} /></td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {t.last_auth_test ? new Date(t.last_auth_test + 'Z').toLocaleString() : 'Never'}
                    </td>
                    <td className="px-5 py-4 text-right space-x-3">
                      <button
                        onClick={() => testAuth(t.id)}
                        disabled={testing === t.id}
                        className="text-emerald-400 hover:text-emerald-300 text-xs font-medium disabled:opacity-50"
                      >
                        {testing === t.id ? '⏳ Testing...' : '🔑 Test Auth'}
                      </button>
                      <button onClick={() => runDiscovery(t.id)} className="text-cyan-400 hover:text-cyan-300 text-xs font-medium">
                        🔍 Discover
                      </button>
                      <a href={`/portal/${t.id}`} className="text-purple-400 hover:text-purple-300 text-xs font-medium">
                        🖥️ Client View
                      </a>
                      <button onClick={() => openEdit(t)} className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-500 mb-4">No tenants configured yet.</p>
              <button onClick={openCreate} className="text-blue-400 hover:text-blue-300 font-medium text-sm">
                + Add your first UKG Ready tenant
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-5">{editTenant ? '✏️ Edit Tenant' : '🏢 Add UKG Ready Tenant'}</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Display Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Merbree / MoMer"
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-sm text-slate-400">Company Short Name</label>
                <input value={form.company_short} onChange={e => setForm({ ...form, company_short: e.target.value })}
                  placeholder="e.g., MOMER0059"
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-sm text-slate-400">Base URL</label>
                <input value={form.base_url} onChange={e => setForm({ ...form, base_url: e.target.value })}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500" />
              </div>

              <div className="border-t border-slate-700 pt-4">
                <p className="text-xs text-slate-500 mb-3">🔒 Credentials (encrypted at rest)</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-slate-400">API Key</label>
                    <input value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })}
                      placeholder={editTenant ? '(unchanged — enter to update)' : 'UKG API Key'}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Username</label>
                    <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Password</label>
                    <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder={editTenant ? '(unchanged — enter to update)' : ''}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
              <button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all">
                {editTenant ? 'Save Changes' : 'Add Tenant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
