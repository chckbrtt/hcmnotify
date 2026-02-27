import { useState } from 'react';

/* ──────────────────────────── data ──────────────────────────── */

const sources = [
  { icon: '📄', name: 'CSV Upload' },
  { icon: '📂', name: 'SFTP Pull' },
  { icon: '🟢', name: 'UKG Ready' },
  { icon: '🔌', name: 'API Endpoint' },
  { icon: '☁️', name: 'Salesforce' },
  { icon: '🗄️', name: 'Database (SQL)' },
  { icon: '🔴', name: 'ADP' },
  { icon: '🟠', name: 'Paychex' },
];

const processingModules = [
  { icon: '🔄', name: 'Field Mapper', ai: true },
  { icon: '🔐', name: 'PGP Encrypt' },
  { icon: '✅', name: 'Validator' },
  { icon: '🔀', name: 'Splitter' },
  { icon: '🔗', name: 'Merger' },
  { icon: '🔧', name: 'Transform' },
  { icon: '🚫', name: 'Filter' },
  { icon: '🤖', name: 'AI Classifier', ai: true },
  { icon: '📝', name: 'Template Engine' },
];

const destinations = [
  { icon: '🟢', name: 'UKG Ready' },
  { icon: '📂', name: 'SFTP Drop' },
  { icon: '🏦', name: 'Archive Vault' },
  { icon: '☁️', name: 'S3 Bucket' },
  { icon: '📋', name: 'Recordkeeper' },
  { icon: '📧', name: 'Email Report' },
  { icon: '📥', name: 'CSV Download' },
  { icon: '🔔', name: 'Webhook' },
];

const templates = [
  { icon: '📥', name: 'New Client Onboarding', desc: 'CSV → Field Map → Validate → UKG Ready', nodes: 4, badge: 'Popular' },
  { icon: '🏦', name: '401(k) Census Feed', desc: 'UKG Ready → Field Map → PGP Encrypt → SFTP Drop', nodes: 4, badge: null },
  { icon: '📋', name: 'Separation Notice', desc: 'UKG Ready (webhook) → Transform → Template → Email', nodes: 4, badge: 'CO SB 22-234' },
  { icon: '📦', name: 'Term Doc Export', desc: 'UKG Ready → Filter → Doc API → ZIP → SFTP Drop', nodes: 5, badge: null },
  { icon: '🏛️', name: 'WOTC New Hire Feed', desc: 'UKG Ready → Filter (new hires) → Transform → Equifax SFTP', nodes: 4, badge: '28-day SLA' },
  { icon: '🗂️', name: 'Legacy Doc Archive', desc: 'CSV/ZIP Upload → AI Classifier → Archive Vault', nodes: 3, badge: 'AI' },
];

// Dynamic mappings per source type
interface MappingSet {
  sourceName: string;
  destName: string;
  pipelineName: string;
  aiTrainedOn: string;
  mappings: { src: string; dst: string; confidence: number; status: string; aiNote?: string }[];
}

const mappingSets: Record<string, MappingSet> = {
  fidelity: {
    sourceName: 'Fidelity NetBenefits',
    destName: 'UKG Ready (Merbree)',
    pipelineName: 'Fidelity → UKG Census Sync',
    aiTrainedOn: '847 successful mappings across 12 tenants',
    mappings: [
      { src: 'SSN', dst: 'Employee_Id', confidence: 98, status: 'Auto-mapped', aiNote: 'Primary key match — SSN format validated' },
      { src: 'First Name', dst: 'FirstName', confidence: 99, status: 'Auto-mapped' },
      { src: 'Last Name', dst: 'LastName', confidence: 99, status: 'Auto-mapped' },
      { src: 'Medical - Employee', dst: 'MED_EE (Deduction)', confidence: 95, status: 'Auto-mapped', aiNote: 'Matched "Medical" → MED, "Employee" → EE pattern' },
      { src: '401k Percentage', dst: '401K_EE (Deduction)', confidence: 82, status: 'Review', aiNote: 'Could be 401K_EE or ROTH_EE — verify with client' },
      { src: 'Dental Family', dst: 'DEN_FAM (Deduction)', confidence: 78, status: 'Review', aiNote: 'Assumed family tier — confirm not DEN_EE+SP' },
      { src: 'Store Location', dst: 'Location Code', confidence: 71, status: 'Review', aiNote: 'Free text → needs location code crosswalk' },
      { src: 'Hire Date', dst: 'OriginalHireDate', confidence: 96, status: 'Auto-mapped', aiNote: 'Date format: MM/DD/YYYY → YYYY-MM-DD auto-transform' },
      { src: 'Salary Grade', dst: '???', confidence: 0, status: 'Unmapped', aiNote: 'No equivalent field in UKG Ready standard schema' },
      { src: 'Custom Field 3', dst: '???', confidence: 0, status: 'Unmapped', aiNote: 'Generic label — ask client what this field contains' },
    ],
  },
  salesforce: {
    sourceName: 'Salesforce CRM',
    destName: 'UKG Ready (Merbree)',
    pipelineName: 'Salesforce → UKG Employee Sync',
    aiTrainedOn: '234 successful mappings across 5 tenants',
    mappings: [
      { src: 'Contact.SSN__c', dst: 'Employee_Id', confidence: 72, status: 'Review', aiNote: 'Custom field — SSN format needs validation' },
      { src: 'Contact.FirstName', dst: 'FirstName', confidence: 97, status: 'Auto-mapped' },
      { src: 'Contact.LastName', dst: 'LastName', confidence: 97, status: 'Auto-mapped' },
      { src: 'Contact.Email', dst: 'WorkEmail', confidence: 94, status: 'Auto-mapped' },
      { src: 'Contact.Phone', dst: 'WorkPhone', confidence: 88, status: 'Auto-mapped', aiNote: 'Could be HomePhone — Salesforce doesn\'t distinguish' },
      { src: 'Contact.MailingCity', dst: 'City', confidence: 91, status: 'Auto-mapped' },
      { src: 'Contact.MailingState', dst: 'State', confidence: 91, status: 'Auto-mapped' },
      { src: 'Account.Name', dst: 'Location Code', confidence: 45, status: 'Review', aiNote: 'Account names rarely match UKG location codes — needs crosswalk' },
      { src: 'Contact.Department', dst: 'Department', confidence: 85, status: 'Auto-mapped', aiNote: 'Text match — verify dept codes exist in UKG' },
      { src: 'Contact.Title', dst: 'JobTitle', confidence: 63, status: 'Review', aiNote: 'SF titles are freeform, UKG uses coded values' },
      { src: 'Opportunity.Amount', dst: '???', confidence: 0, status: 'Unmapped', aiNote: 'Sales data — no HR equivalent' },
      { src: 'Contact.LeadSource', dst: '???', confidence: 0, status: 'Unmapped' },
    ],
  },
  adp: {
    sourceName: 'ADP Workforce Now',
    destName: 'UKG Ready (Merbree)',
    pipelineName: 'ADP → UKG Migration',
    aiTrainedOn: '1,203 successful mappings across 28 tenants',
    mappings: [
      { src: 'File Number', dst: 'Employee_Id', confidence: 94, status: 'Auto-mapped', aiNote: 'ADP File Number = primary identifier, SSN available separately' },
      { src: 'First Name', dst: 'FirstName', confidence: 99, status: 'Auto-mapped' },
      { src: 'Last Name', dst: 'LastName', confidence: 99, status: 'Auto-mapped' },
      { src: 'Position Title', dst: 'JobTitle', confidence: 96, status: 'Auto-mapped', aiNote: 'ADP position titles map cleanly to UKG job titles' },
      { src: 'Home Department Code', dst: 'Department', confidence: 93, status: 'Auto-mapped' },
      { src: 'Location Code', dst: 'Location Code', confidence: 99, status: 'Auto-mapped', aiNote: 'Direct field match — verify code values align' },
      { src: 'Pay Rate', dst: 'PayRate', confidence: 98, status: 'Auto-mapped' },
      { src: 'Pay Frequency', dst: 'PayFrequency', confidence: 95, status: 'Auto-mapped' },
      { src: 'Benefit Class', dst: 'BenefitGroup', confidence: 76, status: 'Review', aiNote: 'ADP benefit classes may not map 1:1 to UKG benefit groups' },
      { src: 'Workers Comp Code', dst: 'WCCode', confidence: 89, status: 'Auto-mapped' },
      { src: 'Accrual Profile', dst: 'AccrualPolicy', confidence: 68, status: 'Review', aiNote: 'PTO accrual rules differ — manual review recommended' },
      { src: 'Clock Badge #', dst: 'BadgeNumber', confidence: 92, status: 'Auto-mapped' },
    ],
  },
  paychex: {
    sourceName: 'Paychex Flex',
    destName: 'UKG Ready (Merbree)',
    pipelineName: 'Paychex → UKG Migration',
    aiTrainedOn: '456 successful mappings across 8 tenants',
    mappings: [
      { src: 'Worker ID', dst: 'Employee_Id', confidence: 91, status: 'Auto-mapped', aiNote: 'Paychex Worker ID — verify format compatibility' },
      { src: 'Legal First Name', dst: 'FirstName', confidence: 99, status: 'Auto-mapped' },
      { src: 'Legal Last Name', dst: 'LastName', confidence: 99, status: 'Auto-mapped' },
      { src: 'Job Title', dst: 'JobTitle', confidence: 97, status: 'Auto-mapped' },
      { src: 'Organization Unit', dst: 'Department', confidence: 74, status: 'Review', aiNote: 'Paychex org units are hierarchical — UKG is flat' },
      { src: 'Work Location', dst: 'Location Code', confidence: 83, status: 'Review', aiNote: 'Name match needed — Paychex uses descriptive names, UKG uses codes' },
      { src: 'Hourly Rate', dst: 'PayRate', confidence: 97, status: 'Auto-mapped' },
      { src: 'Check Code', dst: 'PayGroup', confidence: 69, status: 'Review', aiNote: 'Paychex check codes map loosely to UKG pay groups' },
      { src: 'SUI State', dst: 'SUIState', confidence: 95, status: 'Auto-mapped' },
      { src: 'Direct Deposit Routing', dst: '???', confidence: 0, status: 'Unmapped', aiNote: 'Banking data requires separate secure import process' },
    ],
  },
};

const ukgFields = [
  'Employee_Id', 'FirstName', 'LastName', 'MiddleName', 'WorkEmail', 'HomeEmail',
  'WorkPhone', 'HomePhone', 'City', 'State', 'ZipCode', 'Address1', 'Address2',
  'MED_EE (Deduction)', 'MED_FAM (Deduction)', '401K_EE (Deduction)', 'ROTH_EE (Deduction)',
  'DEN_EE (Deduction)', 'DEN_FAM (Deduction)', 'VIS_EE (Deduction)', 'HSA_EE (Deduction)',
  'Location Code', 'Department', 'JobTitle', 'PayRate', 'PayFrequency', 'PayGroup',
  'OriginalHireDate', 'TerminationDate', 'Status', 'CompanyCode', 'BenefitGroup',
  'WCCode', 'AccrualPolicy', 'BadgeNumber', 'SUIState', 'Supervisor',
];

// Fake run history
const runHistory = [
  { id: 'RUN-0847', date: '2026-02-26 14:30', status: 'success', rows: 1635, duration: '4.2s', errors: 0 },
  { id: 'RUN-0846', date: '2026-02-26 08:00', status: 'success', rows: 1633, duration: '3.8s', errors: 0 },
  { id: 'RUN-0845', date: '2026-02-25 14:30', status: 'warning', rows: 1631, duration: '5.1s', errors: 3 },
  { id: 'RUN-0844', date: '2026-02-25 08:00', status: 'failed', rows: 0, duration: '1.2s', errors: 1 },
  { id: 'RUN-0843', date: '2026-02-24 14:30', status: 'success', rows: 1628, duration: '3.9s', errors: 0 },
];

/* ──────────────────────────── helpers ──────────────────────────── */

function confidenceColor(c: number) {
  if (c >= 90) return { dot: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-900/20', border: 'border-green-600/30' };
  if (c >= 60) return { dot: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-600/30' };
  return { dot: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-600/30' };
}

/* ──────────────────────────── components ──────────────────────────── */

function DraggableChip({ icon, name, ai }: { icon: string; name: string; ai?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 cursor-grab hover:border-slate-500 hover:bg-slate-750 transition-colors select-none group">
      <span>{icon}</span>
      <span className="truncate">{name}</span>
      {ai && (
        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-400 border border-purple-600/30">
          AI
        </span>
      )}
      <span className="ml-auto text-slate-600 group-hover:text-slate-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">⊕</span>
    </div>
  );
}

function PipelineNode({ icon, label, subtitle, status, active, onClick, ai, pulse, errorCount }: {
  icon: string; label: string; subtitle?: string; status: 'ready' | 'ok' | 'warning' | 'error' | 'running';
  active?: boolean; onClick?: () => void; ai?: boolean; pulse?: boolean; errorCount?: number;
}) {
  const borderMap: Record<string, string> = {
    ok: 'border-green-600/40',
    warning: 'border-yellow-600/40',
    error: 'border-red-600/40',
    running: 'border-blue-500 ring-2 ring-blue-500/30',
    ready: 'border-slate-700',
  };
  const border = active ? 'border-blue-500 ring-2 ring-blue-500/30' : borderMap[status];
  const dotColor: Record<string, string> = {
    ok: 'bg-green-500', warning: 'bg-yellow-500', error: 'bg-red-500', running: 'bg-blue-500', ready: 'bg-slate-600',
  };

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center w-44 h-28 rounded-xl bg-slate-900 border-2 ${border} shadow-lg cursor-pointer hover:border-slate-500 transition-all ${pulse ? 'animate-pulse' : ''}`}
    >
      {ai && (
        <span className="absolute -top-2.5 -right-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-400 border border-purple-600/30 shadow-lg shadow-purple-900/20">
          AI
        </span>
      )}
      {errorCount && errorCount > 0 && (
        <span className="absolute -top-2.5 -left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-600 text-white shadow-lg">
          {errorCount}
        </span>
      )}
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {subtitle && <span className="text-[11px] text-slate-500 mt-0.5">{subtitle}</span>}
      <span className={`absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full ${dotColor[status]} ${status === 'running' ? 'animate-pulse' : ''}`} />
    </div>
  );
}

function Arrow({ animated }: { animated?: boolean }) {
  return (
    <div className="flex items-center mx-3 relative">
      <div className={`w-12 h-0.5 ${animated ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 bg-[length:200%_100%] animate-flow' : 'bg-gradient-to-r from-blue-500/60 to-cyan-400/60'}`} />
      <div className={`w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] ${animated ? 'border-l-cyan-400' : 'border-l-cyan-400/60'}`} />
    </div>
  );
}

function MappingPanel({ onClose, mappingSet }: { onClose: () => void; mappingSet: MappingSet }) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const autoCount = mappingSet.mappings.filter(m => m.confidence >= 60).length;
  const reviewCount = mappingSet.mappings.filter(m => m.confidence >= 60 && m.confidence < 90).length;
  const unmappedCount = mappingSet.mappings.filter(m => m.confidence === 0).length;
  const avgConfidence = Math.round(
    mappingSet.mappings.filter(m => m.confidence > 0).reduce((s, m) => s + m.confidence, 0) /
    mappingSet.mappings.filter(m => m.confidence > 0).length
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="w-[780px] max-w-full h-full bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              🔄 AI Field Mapper
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-900/40 text-purple-400 border border-purple-600/30">AI-Powered</span>
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">{mappingSet.sourceName} → {mappingSet.destName}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl">✕</button>
        </div>

        {/* AI stats banner */}
        <div className="mx-5 mt-4 p-4 rounded-xl bg-purple-900/20 border border-purple-600/30">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="text-sm font-medium text-purple-300">
                AI mapped {autoCount}/{mappingSet.mappings.length} fields automatically • {reviewCount} need review • {unmappedCount} unmapped
              </p>
              <p className="text-xs text-purple-400/70 mt-0.5">Trained on {mappingSet.aiTrainedOn}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 bg-slate-800/50 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-green-400">{avgConfidence}%</p>
              <p className="text-[10px] text-slate-500 uppercase">Avg Confidence</p>
            </div>
            <div className="flex-1 bg-slate-800/50 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-purple-400">{mappingSet.mappings.length}</p>
              <p className="text-[10px] text-slate-500 uppercase">Total Fields</p>
            </div>
            <div className="flex-1 bg-slate-800/50 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-green-400">{autoCount - reviewCount}</p>
              <p className="text-[10px] text-slate-500 uppercase">Auto-Mapped</p>
            </div>
            <div className="flex-1 bg-slate-800/50 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-yellow-400">{reviewCount}</p>
              <p className="text-[10px] text-slate-500 uppercase">Need Review</p>
            </div>
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
              {mappingSet.mappings.map((m, i) => {
                const c = confidenceColor(m.confidence);
                return (
                  <tr
                    key={i}
                    className={`border-t border-slate-800 ${m.confidence === 0 ? 'opacity-70' : ''} hover:bg-slate-800/30 transition-colors`}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
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
                        <span className="text-red-400 text-xs font-medium">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
                        {m.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* AI Note tooltip for hovered row */}
          {hoveredRow !== null && mappingSet.mappings[hoveredRow]?.aiNote && (
            <div className="mt-2 p-3 rounded-lg bg-slate-800 border border-slate-700 text-xs">
              <span className="text-purple-400 font-medium">🤖 AI Note: </span>
              <span className="text-slate-400">{mappingSet.mappings[hoveredRow].aiNote}</span>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            💡 Every correction improves AI accuracy for future mappings
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
              Reset to AI Suggestions
            </button>
            <button className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400 transition-all font-medium">
              ✓ Confirm Mappings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ValidatorPanel({ onClose }: { onClose: () => void }) {
  const rules = [
    { field: 'Employee_Id', rule: 'Required, SSN format (XXX-XX-XXXX)', status: 'pass', checked: 1635, failed: 0 },
    { field: 'FirstName', rule: 'Required, non-empty, max 50 chars', status: 'pass', checked: 1635, failed: 0 },
    { field: 'LastName', rule: 'Required, non-empty, max 50 chars', status: 'pass', checked: 1635, failed: 0 },
    { field: 'Location Code', rule: 'Must exist in UKG location table', status: 'warning', checked: 1635, failed: 3 },
    { field: 'PayRate', rule: 'Numeric, > 0, < 500', status: 'pass', checked: 1635, failed: 0 },
    { field: 'OriginalHireDate', rule: 'Valid date, not future, format YYYY-MM-DD', status: 'pass', checked: 1635, failed: 0 },
    { field: 'WorkEmail', rule: 'Valid email format', status: 'warning', checked: 1635, failed: 2 },
    { field: 'Department', rule: 'Must exist in UKG department list', status: 'pass', checked: 1635, failed: 0 },
    { field: 'Duplicate Check', rule: 'No duplicate Employee_Id values', status: 'pass', checked: 1635, failed: 0 },
    { field: 'Row Integrity', rule: 'All required columns present per row', status: 'pass', checked: 1635, failed: 0 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="w-[680px] max-w-full h-full bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">✅ Validation Rules</h2>
            <p className="text-sm text-slate-400 mt-0.5">Pre-load data quality checks</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="mx-5 mt-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-400">8</p>
            <p className="text-[10px] text-slate-500 uppercase">Passed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">2</p>
            <p className="text-[10px] text-slate-500 uppercase">Warnings</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">0</p>
            <p className="text-[10px] text-slate-500 uppercase">Failed</p>
          </div>
        </div>

        <div className="p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left pb-3 font-medium">Field</th>
                <th className="text-left pb-3 font-medium">Rule</th>
                <th className="text-center pb-3 font-medium">Checked</th>
                <th className="text-center pb-3 font-medium">Failed</th>
                <th className="text-center pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r, i) => (
                <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/30">
                  <td className="py-3 text-slate-300 font-mono text-xs">{r.field}</td>
                  <td className="py-3 text-slate-400 text-xs">{r.rule}</td>
                  <td className="py-3 text-center text-slate-400 text-xs">{r.checked.toLocaleString()}</td>
                  <td className="py-3 text-center text-xs font-medium">
                    <span className={r.failed > 0 ? 'text-yellow-400' : 'text-slate-600'}>{r.failed}</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === 'pass' ? 'bg-green-900/20 text-green-400 border border-green-600/30' :
                      r.status === 'warning' ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-600/30' :
                      'bg-red-900/20 text-red-400 border border-red-600/30'
                    }`}>
                      {r.status === 'pass' ? '✓ Pass' : r.status === 'warning' ? '⚠ Warning' : '✕ Fail'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RunHistoryPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="w-[580px] max-w-full h-full bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">📊 Run History</h2>
            <p className="text-sm text-slate-400 mt-0.5">Last 5 pipeline executions</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-5 space-y-3">
          {runHistory.map(run => (
            <div key={run.id} className={`p-4 rounded-xl border ${
              run.status === 'success' ? 'bg-slate-800/50 border-slate-700' :
              run.status === 'warning' ? 'bg-yellow-900/10 border-yellow-700/30' :
              'bg-red-900/10 border-red-700/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    run.status === 'success' ? 'bg-green-500' :
                    run.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm font-mono text-slate-300">{run.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    run.status === 'success' ? 'bg-green-900/30 text-green-400' :
                    run.status === 'warning' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    {run.status}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{run.date}</span>
              </div>
              <div className="flex gap-6 text-xs text-slate-400">
                <span>📊 {run.rows.toLocaleString()} rows</span>
                <span>⏱️ {run.duration}</span>
                <span className={run.errors > 0 ? 'text-red-400' : ''}>
                  {run.errors > 0 ? `❌ ${run.errors} error${run.errors > 1 ? 's' : ''}` : '✓ No errors'}
                </span>
              </div>
              {run.status === 'failed' && (
                <div className="mt-2 p-2 rounded bg-red-900/20 text-xs text-red-400 font-mono">
                  Error: UKG API timeout after 30s — authentication token expired. Auto-retry scheduled.
                </div>
              )}
              {run.status === 'warning' && (
                <div className="mt-2 p-2 rounded bg-yellow-900/20 text-xs text-yellow-400 font-mono">
                  3 rows skipped: Location code "STORE-99" not found in UKG. Sent to error queue for review.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── main page ──────────────────────────── */

export function PipelineBuilderPage() {
  const [showMapping, setShowMapping] = useState(false);
  const [showValidator, setShowValidator] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeSource, setActiveSource] = useState<string>('fidelity');
  const [isRunning, setIsRunning] = useState(false);
  const [runPhase, setRunPhase] = useState(0);

  const currentMapping = mappingSets[activeSource];
  const autoMapped = currentMapping.mappings.filter(m => m.confidence >= 90).length;
  const totalFields = currentMapping.mappings.length;

  const handleRun = () => {
    setIsRunning(true);
    setRunPhase(1);
    setTimeout(() => setRunPhase(2), 1200);
    setTimeout(() => setRunPhase(3), 2400);
    setTimeout(() => setRunPhase(4), 3600);
    setTimeout(() => { setIsRunning(false); setRunPhase(0); }, 5000);
  };

  const sourceLabel: Record<string, string> = {
    fidelity: 'Fidelity Census',
    salesforce: 'Salesforce CRM',
    adp: 'ADP Export',
    paychex: 'Paychex Export',
  };

  return (
    <div className="-m-8 flex flex-col h-screen overflow-hidden">
      {/* ─── Toolbar ─── */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">{currentMapping.pipelineName}</h1>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            isRunning
              ? 'bg-blue-900/30 text-blue-400 border border-blue-700/30 animate-pulse'
              : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/30'
          }`}>
            {isRunning ? '● Running' : 'Draft'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">4 nodes • 3 connections • AI: {autoMapped}/{totalFields} fields mapped</span>
          <button
            onClick={() => setShowHistory(true)}
            className="px-3 py-1.5 rounded-lg text-sm bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          >
            📊 History
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isRunning
                ? 'bg-blue-900/30 text-blue-400 border border-blue-600/30 cursor-wait'
                : 'bg-green-700 text-white hover:bg-green-600'
            }`}
          >
            {isRunning ? '⏳ Running...' : '▶ Run Pipeline'}
          </button>
          <button className="px-3 py-1.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-500 transition-colors">
            💾 Save
          </button>
        </div>
      </div>

      {/* ─── Source Selector + Templates ─── */}
      <div className="px-6 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Source:</span>
          {Object.entries(mappingSets).map(([key, set]) => (
            <button
              key={key}
              onClick={() => setActiveSource(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeSource === key
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
              }`}
            >
              {set.sourceName}
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-slate-700" />
        <div className="flex items-center gap-2 overflow-x-auto flex-1">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider flex-shrink-0">Templates:</span>
          {templates.map(t => (
            <div key={t.name} className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-slate-500 cursor-pointer transition-colors">
              <span>{t.icon}</span>
              <span className="text-xs font-medium text-slate-300">{t.name}</span>
              {t.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  t.badge === 'AI' ? 'bg-purple-900/40 text-purple-400 border border-purple-600/30' :
                  t.badge === 'Popular' ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-600/30' :
                  'bg-amber-900/40 text-amber-400 border border-amber-600/30'
                }`}>
                  {t.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Main Area ─── */}
      <div className="flex flex-1 min-h-0">
        {/* Left Panel — Sources + Modules */}
        <div className="w-52 flex-shrink-0 bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">📥 Sources</p>
          <div className="space-y-2">
            {sources.map(s => <DraggableChip key={s.name} {...s} />)}
          </div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-6 mb-3">⚙️ Modules</p>
          <div className="space-y-2">
            {processingModules.map(m => <DraggableChip key={m.name} {...m} />)}
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

          {/* Running overlay */}
          {isRunning && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-lg bg-blue-900/40 border border-blue-600/30 text-sm text-blue-300 animate-pulse">
              {runPhase === 1 && '📄 Reading source data...'}
              {runPhase === 2 && '🤖 AI mapping fields...'}
              {runPhase === 3 && '✅ Validating 1,635 records...'}
              {runPhase === 4 && '🟢 Pushing to UKG Ready...'}
            </div>
          )}

          {/* Pipeline */}
          <div className="relative flex items-center justify-center h-full gap-0">
            <PipelineNode
              icon={activeSource === 'salesforce' ? '☁️' : activeSource === 'adp' ? '🔴' : activeSource === 'paychex' ? '🟠' : '📄'}
              label={activeSource === 'salesforce' ? 'Salesforce' : activeSource === 'adp' ? 'ADP' : activeSource === 'paychex' ? 'Paychex' : 'CSV Upload'}
              subtitle={sourceLabel[activeSource]}
              status={isRunning && runPhase >= 1 ? 'running' : 'ok'}
              pulse={isRunning && runPhase === 1}
            />
            <Arrow animated={isRunning && runPhase >= 2} />
            <PipelineNode
              icon="🔄"
              label="Field Mapper"
              subtitle={`${autoMapped}/${totalFields} mapped`}
              status={isRunning && runPhase >= 2 ? 'running' : currentMapping.mappings.some(m => m.confidence === 0) ? 'warning' : 'ok'}
              ai
              onClick={() => !isRunning && setShowMapping(true)}
              active={showMapping}
              pulse={isRunning && runPhase === 2}
              errorCount={currentMapping.mappings.filter(m => m.confidence === 0).length || undefined}
            />
            <Arrow animated={isRunning && runPhase >= 3} />
            <PipelineNode
              icon="✅"
              label="Validator"
              subtitle="10 rules"
              status={isRunning && runPhase >= 3 ? 'running' : 'warning'}
              onClick={() => !isRunning && setShowValidator(true)}
              active={showValidator}
              pulse={isRunning && runPhase === 3}
              errorCount={5}
            />
            <Arrow animated={isRunning && runPhase >= 4} />
            <PipelineNode
              icon="🟢"
              label="UKG Ready"
              subtitle="Merbree"
              status={isRunning && runPhase >= 4 ? 'running' : 'ok'}
              pulse={isRunning && runPhase === 4}
            />
          </div>

          {/* hint */}
          {!isRunning && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-600">
              Click nodes to inspect • Switch sources to see AI adapt • <span className="text-green-400">▶ Run</span> to simulate execution
            </p>
          )}
        </div>

        {/* Right Panel — Destinations */}
        <div className="w-52 flex-shrink-0 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">📤 Destinations</p>
          <div className="space-y-2">
            {destinations.map(d => <DraggableChip key={d.name} {...d} />)}
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3">📈 Pipeline Stats</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Runs</span>
                <span className="text-white font-medium">847</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Success Rate</span>
                <span className="text-green-400 font-medium">98.7%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Avg Duration</span>
                <span className="text-white font-medium">4.1s</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Last Run</span>
                <span className="text-white font-medium">26m ago</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Records/Run</span>
                <span className="text-white font-medium">~1,635</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panels */}
      {showMapping && <MappingPanel onClose={() => setShowMapping(false)} mappingSet={currentMapping} />}
      {showValidator && <ValidatorPanel onClose={() => setShowValidator(false)} />}
      {showHistory && <RunHistoryPanel onClose={() => setShowHistory(false)} />}

      {/* animations */}
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slideIn 0.25s ease-out; }
        @keyframes flow { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .animate-flow { animation: flow 1.5s linear infinite; }
      `}</style>
    </div>
  );
}
