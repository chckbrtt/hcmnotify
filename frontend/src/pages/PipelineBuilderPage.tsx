import { useState } from 'react';

/* ──────────────────────────── data ──────────────────────────── */

const sources = [
  { icon: '📄', name: 'CSV Upload' },
  { icon: '📂', name: 'SFTP Pull' },
  { icon: '🟢', name: 'UKG Ready' },
  { icon: '🔌', name: 'API Endpoint' },
  { icon: '☁️', name: 'Salesforce' },
  { icon: '🗄️', name: 'Database (SQL)' },
];

const modules = [
  { icon: '🔄', name: 'Field Mapper', ai: true },
  { icon: '🔐', name: 'PGP Encrypt' },
  { icon: '✅', name: 'Validator' },
  { icon: '🔀', name: 'Splitter' },
  { icon: '🔗', name: 'Merger' },
  { icon: '🔧', name: 'Transform' },
  { icon: '🚫', name: 'Filter' },
];

const destinations = [
  { icon: '🟢', name: 'UKG Ready' },
  { icon: '📂', name: 'SFTP Drop' },
  { icon: '🏦', name: 'Archive Vault' },
  { icon: '☁️', name: 'S3 Bucket' },
  { icon: '📋', name: 'Recordkeeper' },
  { icon: '📧', name: 'Email Report' },
  { icon: '📥', name: 'CSV Download' },
];

const templates = [
  { icon: '📥', name: 'New Client Onboarding', desc: 'CSV → Field Map → Validate → UKG Ready' },
  { icon: '🏦', name: '401(k) Census Feed', desc: 'UKG Ready → Field Map → PGP Encrypt → SFTP Drop' },
  { icon: '📋', name: 'Separation Notice', desc: 'UKG Ready (webhook) → Transform → Template → Email' },
  { icon: '📦', name: 'Term Doc Export', desc: 'UKG Ready → Filter → Doc API → ZIP → SFTP Drop' },
];

const mappings = [
  { src: 'SSN', dst: 'Employee_Id', confidence: 98, status: 'Auto-mapped' },
  { src: 'First Name', dst: 'FirstName', confidence: 99, status: 'Auto-mapped' },
  { src: 'Last Name', dst: 'LastName', confidence: 99, status: 'Auto-mapped' },
  { src: 'Medical - Employee', dst: 'MED_EE (Deduction)', confidence: 95, status: 'Auto-mapped' },
  { src: '401k Percentage', dst: '401K_EE (Deduction)', confidence: 82, status: 'Review' },
  { src: 'Dental Family', dst: 'DEN_FAM (Deduction)', confidence: 78, status: 'Review' },
  { src: 'Store Location', dst: 'Location Code', confidence: 71, status: 'Review' },
  { src: 'Hire Date', dst: 'OriginalHireDate', confidence: 96, status: 'Auto-mapped' },
  { src: 'Salary Grade', dst: '???', confidence: 0, status: 'Unmapped' },
  { src: 'Custom Field 3', dst: '???', confidence: 0, status: 'Unmapped' },
];

const ukgFields = [
  'Employee_Id', 'FirstName', 'LastName', 'MED_EE (Deduction)', '401K_EE (Deduction)',
  'DEN_FAM (Deduction)', 'Location Code', 'OriginalHireDate', 'PayRate', 'Department',
  'JobTitle', 'TerminationDate', 'Status', 'CompanyCode', 'WorkEmail',
];

/* ──────────────────────────── helpers ──────────────────────────── */

function confidenceColor(c: number) {
  if (c >= 90) return { dot: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-900/20' };
  if (c >= 60) return { dot: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-900/20' };
  return { dot: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-900/20' };
}

/* ──────────────────────────── components ──────────────────────────── */

function DraggableChip({ icon, name, ai }: { icon: string; name: string; ai?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 cursor-grab hover:border-slate-500 hover:bg-slate-750 transition-colors select-none">
      <span>{icon}</span>
      <span className="truncate">{name}</span>
      {ai && (
        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-400 border border-purple-600/30">
          AI
        </span>
      )}
    </div>
  );
}

function PipelineNode({ icon, label, subtitle, status, active, onClick, ai }: {
  icon: string; label: string; subtitle?: string; status: 'ready' | 'ok' | 'warning';
  active?: boolean; onClick?: () => void; ai?: boolean;
}) {
  const border = active ? 'border-blue-500 ring-2 ring-blue-500/30' :
    status === 'ok' ? 'border-green-600/40' : status === 'warning' ? 'border-yellow-600/40' : 'border-slate-700';
  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center w-44 h-24 rounded-xl bg-slate-900 border ${border} shadow-lg cursor-pointer hover:border-slate-500 transition-all`}
    >
      {ai && (
        <span className="absolute -top-2 -right-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-400 border border-purple-600/30">
          AI
        </span>
      )}
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {subtitle && <span className="text-[11px] text-slate-500">{subtitle}</span>}
      <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
        status === 'ok' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-slate-600'
      }`} />
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center mx-2">
      <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400" />
      <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-cyan-400" />
    </div>
  );
}

function MappingPanel({ onClose }: { onClose: () => void }) {
  const autoCount = mappings.filter(m => m.confidence >= 60).length;
  const reviewCount = mappings.filter(m => m.confidence >= 60 && m.confidence < 90).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="w-[720px] max-w-full h-full bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              🔄 Field Mapper
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-900/40 text-purple-400 border border-purple-600/30">AI</span>
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">Fidelity Census → UKG Ready (Merbree)</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl">✕</button>
        </div>

        {/* AI banner */}
        <div className="mx-5 mt-4 p-3 rounded-lg bg-purple-900/20 border border-purple-600/30 flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <p className="text-sm font-medium text-purple-300">AI mapped {autoCount}/10 fields automatically • {reviewCount} need review</p>
            <p className="text-xs text-purple-400/70 mt-0.5">Confidence based on field name similarity, data type analysis, and historical mappings</p>
          </div>
        </div>

        {/* table */}
        <div className="p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left pb-3 font-medium">Source Field</th>
                <th className="pb-3 w-6"></th>
                <th className="text-left pb-3 font-medium">UKG Ready Field</th>
                <th className="text-center pb-3 font-medium">Confidence</th>
                <th className="text-left pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m, i) => {
                const c = confidenceColor(m.confidence);
                return (
                  <tr key={i} className={`border-t border-slate-800 ${m.confidence === 0 ? 'opacity-70' : ''}`}>
                    <td className="py-3 text-slate-300 font-mono text-xs">{m.src}</td>
                    <td className="py-3 text-slate-600 text-center">→</td>
                    <td className="py-3">
                      <select
                        defaultValue={m.dst}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 w-full focus:border-blue-500 focus:outline-none"
                      >
                        {m.confidence === 0 && <option value="???">— Select field —</option>}
                        {ukgFields.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 text-center">
                      {m.confidence > 0 ? (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.text}`}>
                          <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                          {m.confidence}%
                        </span>
                      ) : (
                        <span className="text-red-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">Changes auto-saved</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
              Reset to AI Suggestions
            </button>
            <button className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-500 transition-colors">
              Confirm Mappings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── main page ──────────────────────────── */

export function PipelineBuilderPage() {
  const [showMapping, setShowMapping] = useState(false);

  return (
    <div className="-m-8 flex flex-col h-screen overflow-hidden">
      {/* ─── Toolbar ─── */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">Fidelity → UKG Census Sync</h1>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-700/30">
            Draft
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">4 nodes • 3 connections • AI: 8/10 fields mapped</span>
          <button
            className="px-3 py-1.5 rounded-lg text-sm bg-slate-800 text-slate-400 cursor-not-allowed opacity-60"
            title="Pipeline in draft mode"
            disabled
          >
            ▶ Run Pipeline
          </button>
          <button className="px-3 py-1.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-500 transition-colors">
            💾 Save
          </button>
        </div>
      </div>

      {/* ─── Templates ─── */}
      <div className="px-6 py-3 bg-slate-900/50 border-b border-slate-800">
        <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Pipeline Templates</p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {templates.map(t => (
            <div key={t.name} className="flex-shrink-0 flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-500 cursor-pointer transition-colors">
              <span className="text-lg">{t.icon}</span>
              <div>
                <p className="text-sm font-medium text-slate-200">{t.name}</p>
                <p className="text-[11px] text-slate-500">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Main Area ─── */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel — Sources */}
        <div className="w-52 flex-shrink-0 bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Sources</p>
          <div className="space-y-2">
            {sources.map(s => <DraggableChip key={s.name} {...s} />)}
          </div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-6 mb-3">Modules</p>
          <div className="space-y-2">
            {modules.map(m => <DraggableChip key={m.name} {...m} />)}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-slate-950 relative overflow-auto">
          {/* grid background */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Pipeline */}
          <div className="relative flex items-center justify-center h-full gap-0">
            <PipelineNode icon="📄" label="CSV Upload" subtitle="Fidelity Census" status="ok" />
            <Arrow />
            <PipelineNode
              icon="🔄"
              label="Field Mapper"
              subtitle="8/10 mapped"
              status="warning"
              ai
              onClick={() => setShowMapping(true)}
              active={showMapping}
            />
            <Arrow />
            <PipelineNode icon="✅" label="Validator" subtitle="10 rules" status="ok" />
            <Arrow />
            <PipelineNode icon="🟢" label="UKG Ready" subtitle="Merbree" status="ok" />
          </div>

          {/* hint */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-600">
            Click the <span className="text-purple-400">Field Mapper</span> node to see AI mappings
          </p>
        </div>

        {/* Right Panel — Destinations */}
        <div className="w-52 flex-shrink-0 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">Destinations</p>
          <div className="space-y-2">
            {destinations.map(d => <DraggableChip key={d.name} {...d} />)}
          </div>
        </div>
      </div>

      {/* Mapping slide-out */}
      {showMapping && <MappingPanel onClose={() => setShowMapping(false)} />}

      {/* slide-in animation */}
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slideIn 0.25s ease-out; }
      `}</style>
    </div>
  );
}
