export function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">⚙️ Platform Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Configuration & system information</p>
      </div>

      {/* Platform Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="font-semibold mb-4 text-lg">Platform</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-500">Product:</span> <span className="font-medium ml-2">HCMNotify</span></div>
          <div><span className="text-slate-500">Version:</span> <span className="font-mono ml-2">0.1.0-prototype</span></div>
          <div><span className="text-slate-500">Company:</span> <span className="ml-2">CPB3 Tech LLC</span></div>
          <div><span className="text-slate-500">Platform:</span> <span className="ml-2">UKG Ready (SaaShr)</span></div>
          <div><span className="text-slate-500">Backend:</span> <span className="font-mono ml-2">Node.js + Express + SQLite</span></div>
          <div><span className="text-slate-500">Frontend:</span> <span className="font-mono ml-2">React + Tailwind CSS</span></div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="font-semibold mb-4 text-lg">Capabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: '🏢', name: 'Multi-Tenant Management', status: 'active', desc: 'Connect unlimited UKG Ready tenants with encrypted credential storage' },
            { icon: '🔑', name: 'OAuth2 Authentication', status: 'active', desc: 'Automated auth testing, JWT decode, OIDC discovery' },
            { icon: '🔌', name: 'API Explorer', status: 'active', desc: 'Interactive UKG API testing with preset endpoints and history' },
            { icon: '🔔', name: 'Webhook Event Monitoring', status: 'active', desc: 'Real-time DD change alerts with severity classification' },
            { icon: '📊', name: 'Saved Report Sync (v1)', status: 'active', desc: 'One-call bulk data pull via UKG v1 saved reports' },
            { icon: '🤖', name: 'AI Supervisor', status: 'planned', desc: 'Auto-remediation of known failure patterns, anomaly detection' },
            { icon: '🔄', name: 'ETL Pipeline', status: 'planned', desc: 'Automated data sync with configurable schedules and transforms' },
            { icon: '📧', name: 'Alert Notifications', status: 'planned', desc: 'Email, SMS, and webhook alerts for critical events' },
          ].map(cap => (
            <div key={cap.name} className="flex items-start gap-3 p-4 bg-slate-800/30 rounded-lg">
              <span className="text-xl">{cap.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{cap.name}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    cap.status === 'active' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {cap.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{cap.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook Configuration */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="font-semibold mb-4 text-lg">Webhook Configuration</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
            <div>
              <p className="font-medium">Inbound Webhook URL</p>
              <code className="text-xs text-cyan-400 font-mono">{window.location.origin}/api/webhook/ukg</code>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/webhook/ukg`)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >📋 Copy</button>
          </div>
          <div className="p-3 bg-slate-800/30 rounded-lg">
            <p className="font-medium mb-2">Supported Events</p>
            <div className="flex gap-2 flex-wrap">
              {['ACCOUNT_CREATED', 'ACCOUNT_UPDATED', 'EMPLOYEE_CREATED', 'EMPLOYEE_UPDATED'].map(e => (
                <span key={e} className="text-xs font-mono bg-slate-700 px-2 py-1 rounded">{e}</span>
              ))}
            </div>
          </div>
          <div className="p-3 bg-amber-900/10 border border-amber-600/20 rounded-lg">
            <p className="text-amber-400 text-xs">
              ⚠️ UKG Ready Webhook Setup: Settings → Global Setup → Webhook Subscriptions → Add the URL above. 
              Select ACCOUNT_CREATED and ACCOUNT_UPDATED events. UKG retries up to 5 times on failure.
            </p>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="font-semibold mb-4 text-lg">Security</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-emerald-500">✓</span>
            <span>Credentials encrypted at rest (AES-256-GCM)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-500">✓</span>
            <span>API credentials never sent to browser (server-side proxy)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-500">✓</span>
            <span>Session-based authentication with bcrypt password hashing</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-500">✓</span>
            <span>Activity logging for all API calls and tenant operations</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-amber-500">○</span>
            <span className="text-slate-400">RBAC with role-based permissions (planned)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-amber-500">○</span>
            <span className="text-slate-400">Audit trail export (planned)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
