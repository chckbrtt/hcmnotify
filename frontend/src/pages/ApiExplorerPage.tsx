import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

interface Tenant {
  id: string;
  name: string;
  company_short: string;
  company_id: string | null;
  status: string;
}

interface PresetEndpoint {
  name: string;
  method: string;
  path: string;
  accept?: string;
  description?: string;
  params?: { name: string; label: string; required: boolean }[];
}

interface PresetCategory {
  name: string;
  icon: string;
  endpoints: PresetEndpoint[];
}

interface ApiResponse {
  success: boolean;
  statusCode: number;
  body: string;
  contentType: string;
  responseMs: number;
  error?: string;
}

interface HistoryItem {
  id: number;
  method: string;
  path: string;
  status_code: number;
  response_ms: number;
  created_at: string;
}

function CsvTable({ csv }: { csv: string }) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return <pre className="text-xs text-slate-400">{csv}</pre>;

  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  const rows = lines.slice(1, 51).map(line => {
    const vals: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { vals.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    vals.push(current.trim());
    return vals;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-slate-800/50 text-slate-400">
          <tr>{headers.map((h, i) => <th key={i} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-800/30">
              {row.map((val, j) => <td key={j} className="px-3 py-1.5 whitespace-nowrap">{val}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {lines.length > 51 && <p className="text-xs text-slate-500 p-3">Showing first 50 of {lines.length - 1} rows</p>}
    </div>
  );
}

function JsonView({ json }: { json: string }) {
  try {
    const formatted = JSON.stringify(JSON.parse(json), null, 2);
    return <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap">{formatted}</pre>;
  } catch {
    return <pre className="text-xs text-slate-400">{json}</pre>;
  }
}

export function ApiExplorerPage() {
  const { data: tenants } = useApi<Tenant[]>('/api/tenants');
  const { data: presets } = useApi<{ categories: PresetCategory[] }>('/api/explorer/presets');

  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('');
  const [accept, setAccept] = useState('application/json');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [sending, setSending] = useState(false);
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history when tenant changes
  useEffect(() => {
    if (selectedTenant) {
      fetch(`/api/explorer/history/${selectedTenant}`, { credentials: 'include' })
        .then(r => r.json())
        .then(setHistory)
        .catch(() => {});
    }
  }, [selectedTenant, response]);

  const sendRequest = async () => {
    if (!selectedTenant || !path) return;
    setSending(true);
    setResponse(null);

    try {
      const res = await fetch('/api/explorer/request', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: selectedTenant, method, path, accept }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setResponse({ success: false, statusCode: 0, body: '', contentType: '', responseMs: 0, error: err.message });
    } finally {
      setSending(false);
    }
  };

  const selectPreset = (endpoint: PresetEndpoint) => {
    setMethod(endpoint.method);
    let p = endpoint.path;
    // Handle params
    if (endpoint.params) {
      for (const param of endpoint.params) {
        const val = prompt(`Enter ${param.label}:`, '');
        if (val) p = p.replace(`{${param.name}}`, val);
      }
    }
    setPath(p);
    if (endpoint.accept) setAccept(endpoint.accept);
  };

  const isCsv = response?.contentType?.includes('csv') || response?.body?.startsWith('"') || (response?.body?.includes(',') && response?.body?.includes('\n'));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">🔌 API Explorer</h2>
        <p className="text-slate-500 text-sm mt-1">Test UKG Ready endpoints against connected tenants</p>
      </div>

      {/* Tenant Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-slate-400">Tenant:</label>
        <select
          value={selectedTenant}
          onChange={e => setSelectedTenant(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm min-w-[250px] focus:outline-none focus:border-blue-500"
        >
          <option value="">Select a tenant...</option>
          {tenants?.filter(t => t.status !== 'inactive').map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.company_short})</option>
          ))}
        </select>
        {selectedTenant && tenants && (
          <span className="text-xs text-slate-500">
            Company ID: {tenants.find(t => t.id === selectedTenant)?.company_id || 'unknown'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel — Presets + History */}
        <div className="col-span-3 space-y-4">
          {/* Presets */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 text-sm font-semibold">Endpoints</div>
            <div className="divide-y divide-slate-800">
              {presets?.categories.map(cat => (
                <div key={cat.name}>
                  <div className="px-4 py-2 text-xs text-slate-500 font-medium bg-slate-800/30">
                    {cat.icon} {cat.name}
                  </div>
                  {cat.endpoints.map(ep => (
                    <button
                      key={ep.name}
                      onClick={() => selectPreset(ep)}
                      disabled={!selectedTenant}
                      className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-30"
                    >
                      <span className={`font-mono mr-2 ${ep.method === 'GET' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {ep.method}
                      </span>
                      {ep.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 text-sm font-semibold">History</div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800">
                {history.slice(0, 15).map(h => (
                  <button
                    key={h.id}
                    onClick={() => { setMethod(h.method); setPath(h.path); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800/50 transition-colors"
                  >
                    <span className={`font-mono mr-1 ${h.status_code < 400 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {h.status_code}
                    </span>
                    <span className="text-slate-400 truncate">{h.path}</span>
                    <span className="text-slate-600 ml-1">{h.response_ms}ms</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel — Request & Response */}
        <div className="col-span-9 space-y-4">
          {/* Request Bar */}
          <div className="flex items-center gap-2">
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
            </select>
            <input
              value={path}
              onChange={e => setPath(e.target.value)}
              placeholder="/v1/report/saved/43994775"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500"
            />
            <select
              value={accept}
              onChange={e => setAccept(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-slate-400 focus:outline-none focus:border-blue-500"
            >
              <option value="application/json">JSON</option>
              <option value="text/csv">CSV</option>
            </select>
            <button
              onClick={sendRequest}
              disabled={sending || !selectedTenant || !path}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {sending ? '⏳ Sending...' : '▶ Send'}
            </button>
          </div>

          {/* Response */}
          {response && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-bold ${response.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    {response.statusCode || 'ERR'} {response.success ? 'OK' : 'Error'}
                  </span>
                  <span className="text-xs text-slate-500">{response.responseMs}ms</span>
                  <span className="text-xs text-slate-600">{response.contentType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'formatted' ? 'raw' : 'formatted')}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    {viewMode === 'formatted' ? '{ }' : '📋'} {viewMode === 'formatted' ? 'Raw' : 'Formatted'}
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(response.body)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([response.body], { type: response.contentType });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `response.${isCsv ? 'csv' : 'json'}`;
                      a.click();
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    ⬇ Download
                  </button>
                </div>
              </div>

              <div className="max-h-[500px] overflow-auto p-4">
                {response.error ? (
                  <p className="text-red-400 text-sm">{response.error}</p>
                ) : viewMode === 'raw' ? (
                  <pre className="text-xs font-mono text-slate-400 whitespace-pre-wrap">{response.body}</pre>
                ) : isCsv ? (
                  <CsvTable csv={response.body} />
                ) : (
                  <JsonView json={response.body} />
                )}
              </div>
            </div>
          )}

          {!response && !sending && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <p className="text-slate-500">Select a tenant and endpoint, then click Send to make a request.</p>
              <p className="text-slate-600 text-xs mt-2">Requests are proxied through HCMNotify — credentials never reach the browser.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
