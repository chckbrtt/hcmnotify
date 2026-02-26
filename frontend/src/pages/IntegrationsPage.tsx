import { useState } from 'react';

interface Integration {
  name: string;
  description: string;
  logo: string;
  status: 'available' | 'coming_soon' | 'beta';
  popular?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  integrations: Integration[];
}

const categories: Category[] = [
  {
    id: 'recordkeepers',
    name: 'Recordkeepers',
    icon: '🏦',
    description: 'Benefits administration & 401(k) recordkeeping platforms',
    integrations: [
      { name: 'Fidelity NetBenefits', description: 'Retirement & benefits recordkeeping. Auto-sync census data, contribution changes, and enrollment events.', logo: '🟢', status: 'available', popular: true },
      { name: 'Empower Retirement', description: '401(k) plan administration with automated eligibility file feeds and contribution reconciliation.', logo: '🔵', status: 'available' },
      { name: 'Principal Financial', description: 'Group benefits & retirement. Census sync, life event triggers, and contribution file generation.', logo: '🟠', status: 'available' },
      { name: 'Voya Financial', description: 'Retirement plan services with automated enrollment feeds and compliance reporting.', logo: '🟡', status: 'coming_soon' },
      { name: 'John Hancock', description: 'Retirement plan administration. Census data sync and contribution file automation.', logo: '🔴', status: 'coming_soon' },
      { name: 'TIAA', description: 'Higher education & nonprofit retirement plans with automated data feeds.', logo: '🟣', status: 'coming_soon' },
    ],
  },
  {
    id: 'crms',
    name: 'CRMs',
    icon: '🤝',
    description: 'Customer relationship management & sales platforms',
    integrations: [
      { name: 'Salesforce', description: 'Bi-directional sync of employee data, org charts, and client account mapping.', logo: '☁️', status: 'available', popular: true },
      { name: 'HubSpot', description: 'Contact sync, deal pipeline integration, and automated client onboarding workflows.', logo: '🟠', status: 'available' },
      { name: 'Zoho CRM', description: 'Employee-to-contact mapping, org chart sync, and custom module integration.', logo: '🔴', status: 'beta' },
      { name: 'Monday.com', description: 'Project and client tracking with automated status updates from HR events.', logo: '🟡', status: 'coming_soon' },
      { name: 'Pipedrive', description: 'Sales pipeline sync with employee onboarding and client relationship tracking.', logo: '🟢', status: 'coming_soon' },
    ],
  },
  {
    id: 'payroll',
    name: 'Payroll',
    icon: '💰',
    description: 'Payroll processing & tax compliance platforms',
    integrations: [
      { name: 'ADP Run / Workforce Now', description: 'Payroll data sync, tax filing integration, and GL export automation.', logo: '🔴', status: 'available', popular: true },
      { name: 'Paychex Flex', description: 'Payroll processing sync with time data import and tax compliance feeds.', logo: '🔵', status: 'available' },
      { name: 'Gusto', description: 'Small business payroll sync with automated new hire and termination feeds.', logo: '🟢', status: 'available' },
      { name: 'Paylocity', description: 'Mid-market payroll with advanced GL mapping and benefits deduction sync.', logo: '🟡', status: 'beta' },
      { name: 'Paycom', description: 'Single-database payroll & HR with automated data reconciliation.', logo: '🟢', status: 'coming_soon' },
      { name: 'iSolved', description: 'HCM & payroll sync with intelligent tax filing and compliance automation.', logo: '🔵', status: 'coming_soon' },
    ],
  },
  {
    id: 'peos',
    name: 'PEOs',
    icon: '🏢',
    description: 'Professional employer organizations & co-employment platforms',
    integrations: [
      { name: 'TriNet', description: 'Co-employment data sync, benefits administration, and compliance event feeds.', logo: '🔵', status: 'available', popular: true },
      { name: 'Justworks', description: 'PEO payroll & benefits sync with automated onboarding and termination flows.', logo: '🟣', status: 'available' },
      { name: 'Insperity', description: 'Enterprise PEO with HR data sync, workers comp, and performance management feeds.', logo: '🟢', status: 'beta' },
      { name: 'Oasis (Paychex)', description: 'PEO division payroll sync and co-employment census management.', logo: '🔵', status: 'coming_soon' },
      { name: 'CoAdvantage', description: 'Mid-market PEO integration with compliance monitoring and HR event sync.', logo: '🟠', status: 'coming_soon' },
    ],
  },
  {
    id: 'accounting',
    name: 'Accounting',
    icon: '📊',
    description: 'General ledger, accounts payable & financial platforms',
    integrations: [
      { name: 'QuickBooks Online', description: 'GL journal entry export, payroll cost allocation, and vendor payment sync.', logo: '🟢', status: 'available', popular: true },
      { name: 'Sage Intacct', description: 'Multi-entity GL mapping, department allocation, and financial reporting feeds.', logo: '🟢', status: 'available' },
      { name: 'NetSuite', description: 'ERP integration with automated payroll journal entries, cost center mapping, and employee sync.', logo: '🟠', status: 'available' },
      { name: 'Xero', description: 'Cloud accounting with payroll cost export and expense categorization.', logo: '🔵', status: 'beta' },
      { name: 'Microsoft Dynamics 365', description: 'Enterprise financial sync with multi-company GL posting and budget feeds.', logo: '🔵', status: 'coming_soon' },
      { name: 'SAP Business One', description: 'SMB ERP with HR cost allocation and financial consolidation feeds.', logo: '🔵', status: 'coming_soon' },
    ],
  },
  {
    id: 'other',
    name: 'Other',
    icon: '🔗',
    description: 'Point of sale, time & attendance, and specialty integrations',
    integrations: [
      { name: 'PAR Brink POS', description: 'Restaurant POS sales data, labor scheduling, and tip allocation sync.', logo: '🍕', status: 'available', popular: true },
      { name: 'Toast POS', description: 'Restaurant POS with sales reporting, labor cost, and tip pooling integration.', logo: '🟠', status: 'beta' },
      { name: 'Square', description: 'POS and payments data sync with employee timecard and tip reporting.', logo: '⬛', status: 'coming_soon' },
      { name: 'Deputy', description: 'Workforce scheduling and time tracking with automated timesheet import.', logo: '🔵', status: 'available' },
      { name: 'When I Work', description: 'Employee scheduling sync with shift data, availability, and time-off feeds.', logo: '🟢', status: 'coming_soon' },
      { name: 'E-Verify', description: 'Automated I-9 and employment eligibility verification workflow.', logo: '🇺🇸', status: 'coming_soon' },
      { name: 'Slack', description: 'HR event notifications, onboarding workflows, and team directory sync.', logo: '🟣', status: 'coming_soon' },
      { name: 'Microsoft Teams', description: 'New hire announcements, org chart sync, and HR notification channels.', logo: '🔵', status: 'coming_soon' },
    ],
  },
];

function StatusTag({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: 'bg-emerald-900/30 text-emerald-400 border-emerald-600/30',
    beta: 'bg-amber-900/30 text-amber-400 border-amber-600/30',
    coming_soon: 'bg-slate-700/50 text-slate-400 border-slate-600/30',
  };
  const labels: Record<string, string> = {
    available: '✓ Available',
    beta: '⚡ Beta',
    coming_soon: '🔜 Coming Soon',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState('recordkeepers');
  const [search, setSearch] = useState('');

  const currentCategory = categories.find(c => c.id === activeCategory);

  const allIntegrations = categories.flatMap(c => c.integrations.map(i => ({ ...i, category: c.name })));
  const searchResults = search.length > 1
    ? allIntegrations.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()))
    : null;

  const totalAvailable = allIntegrations.filter(i => i.status === 'available').length;
  const totalBeta = allIntegrations.filter(i => i.status === 'beta').length;
  const totalComingSoon = allIntegrations.filter(i => i.status === 'coming_soon').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🔗 Integration Marketplace</h2>
          <p className="text-slate-500 text-sm mt-1">Connect UKG Ready to your entire tech stack</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-emerald-400 font-medium">{totalAvailable} Available</span>
          <span className="text-amber-400 font-medium">{totalBeta} Beta</span>
          <span className="text-slate-400">{totalComingSoon} Coming Soon</span>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search integrations..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {searchResults ? (
        /* Search Results */
        <div>
          <p className="text-sm text-slate-500 mb-4">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{search}"</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map(i => (
              <div key={i.name} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{i.logo}</span>
                    <div>
                      <p className="font-semibold text-sm">{i.name}</p>
                      <p className="text-xs text-slate-600">{i.category}</p>
                    </div>
                  </div>
                  <StatusTag status={i.status} />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{i.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Category View */
        <div className="flex gap-6">
          {/* Category Sidebar */}
          <div className="w-56 flex-shrink-0 space-y-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${
                  activeCategory === cat.id
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="ml-auto text-xs text-slate-600">{cat.integrations.length}</span>
              </button>
            ))}
          </div>

          {/* Integration Grid */}
          <div className="flex-1">
            {currentCategory && (
              <>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span>{currentCategory.icon}</span> {currentCategory.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{currentCategory.description}</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {currentCategory.integrations.map(integration => (
                    <div
                      key={integration.name}
                      className={`bg-slate-900 border rounded-xl p-5 transition-all hover:shadow-lg ${
                        integration.status === 'available'
                          ? 'border-slate-800 hover:border-emerald-600/30'
                          : 'border-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{integration.logo}</span>
                          <div>
                            <p className="font-semibold">{integration.name}</p>
                            {integration.popular && (
                              <span className="text-xs text-cyan-400">⭐ Popular</span>
                            )}
                          </div>
                        </div>
                        <StatusTag status={integration.status} />
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">{integration.description}</p>
                      {integration.status === 'available' && (
                        <button className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 py-2.5 rounded-lg transition-colors font-medium">
                          Configure →
                        </button>
                      )}
                      {integration.status === 'beta' && (
                        <button className="mt-4 w-full bg-amber-900/20 hover:bg-amber-900/30 text-sm text-amber-400 py-2.5 rounded-lg transition-colors font-medium border border-amber-600/20">
                          Request Access →
                        </button>
                      )}
                      {integration.status === 'coming_soon' && (
                        <button className="mt-4 w-full bg-slate-800/50 text-sm text-slate-500 py-2.5 rounded-lg font-medium cursor-not-allowed">
                          Notify Me
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
