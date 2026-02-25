/**
 * Seed sample webhook events for demo purposes.
 * Run: npx tsx src/db/seed-events.ts
 */
import { getDb } from './database';

const db = getDb();

// Create webhook_events table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS webhook_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT,
    event_type TEXT NOT NULL,
    event_id TEXT,
    employee_id TEXT,
    employee_name TEXT,
    company_id TEXT,
    payload TEXT,
    severity TEXT DEFAULT 'info',
    status TEXT DEFAULT 'new',
    processed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  )
`);

// Sample events (based on real UKG webhook data Chuck has seen)
const events = [
  {
    event_type: 'ACCOUNT_UPDATED',
    event_id: 'evt_dd_001',
    employee_id: '12929788445',
    employee_name: 'Sarah Barba',
    company_id: '33629692',
    severity: 'critical',
    payload: JSON.stringify({
      eventType: 'ACCOUNT_UPDATED',
      fields: { accountNumber: '****7314', routingNumber: '****3021', amount: '100%' },
      timestamp: '2026-02-24T15:30:00Z',
      details: 'Direct deposit routing and account number changed'
    }),
    created_at: "datetime('now', '-1 day')"
  },
  {
    event_type: 'ACCOUNT_UPDATED',
    event_id: 'evt_dd_002',
    employee_id: '12929760655',
    employee_name: 'Marcus Johnson',
    company_id: '33629692',
    severity: 'critical',
    payload: JSON.stringify({
      eventType: 'ACCOUNT_UPDATED',
      fields: { accountNumber: '****8891', routingNumber: '****4420', amount: '100%' },
      timestamp: '2026-02-25T09:15:00Z',
      details: 'Direct deposit account changed - new bank routing'
    }),
    created_at: "datetime('now', '-2 hours')"
  },
  {
    event_type: 'ACCOUNT_CREATED',
    event_id: 'evt_dd_003',
    employee_id: '12929801122',
    employee_name: 'Jennifer Torres',
    company_id: '33629692',
    severity: 'warning',
    payload: JSON.stringify({
      eventType: 'ACCOUNT_CREATED',
      fields: { accountNumber: '****5567', routingNumber: '****1100', amount: '50%' },
      timestamp: '2026-02-25T11:45:00Z',
      details: 'New direct deposit account added (split deposit)'
    }),
    created_at: "datetime('now', '-30 minutes')"
  },
  {
    event_type: 'ACCOUNT_UPDATED',
    event_id: 'evt_dd_004',
    employee_id: '12929815533',
    employee_name: 'David Chen',
    company_id: '33679548',
    severity: 'critical',
    payload: JSON.stringify({
      eventType: 'ACCOUNT_UPDATED',
      fields: { accountNumber: '****2200', routingNumber: '****7788', amount: '100%' },
      timestamp: '2026-02-25T14:00:00Z',
      details: 'Direct deposit fully redirected to new account'
    }),
    created_at: "datetime('now', '-5 minutes')"
  },
];

const stmt = db.prepare(`
  INSERT INTO webhook_events (tenant_id, event_type, event_id, employee_id, employee_name, company_id, payload, severity, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ${''})
`);

// We need dynamic SQL for the datetime expressions
for (const evt of events) {
  db.prepare(`
    INSERT INTO webhook_events (tenant_id, event_type, event_id, employee_id, employee_name, company_id, payload, severity, status, created_at)
    VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, 'new', ${evt.created_at})
  `).run(evt.event_type, evt.event_id, evt.employee_id, evt.employee_name, evt.company_id, evt.payload, evt.severity);
}

console.log(`Seeded ${events.length} webhook events`);

// Verify
const count = (db.prepare('SELECT COUNT(*) as c FROM webhook_events').get() as any).c;
console.log(`Total events in DB: ${count}`);
