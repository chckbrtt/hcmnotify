import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(__dirname, '..', '..', 'hcmnotify.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
    console.log('[DB] Connected:', dbPath);
  }
  return db;
}

export function closeDb(): void {
  if (db) { db.close(); db = null; }
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name  TEXT,
      role          TEXT DEFAULT 'admin',
      created_at    TEXT DEFAULT (datetime('now')),
      last_login    TEXT
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      company_short TEXT NOT NULL,
      company_id    TEXT,
      base_url      TEXT NOT NULL,
      api_key_enc   TEXT NOT NULL,
      username      TEXT NOT NULL,
      password_enc  TEXT NOT NULL,
      auth_endpoint TEXT,
      token_endpoint TEXT,
      status        TEXT DEFAULT 'pending',
      last_auth_test TEXT,
      last_error    TEXT,
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now')),
      created_by    TEXT
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id     TEXT REFERENCES tenants(id),
      action        TEXT NOT NULL,
      detail        TEXT,
      status        TEXT,
      response_ms   INTEGER,
      created_at    TEXT DEFAULT (datetime('now')),
      created_by    TEXT
    );

    CREATE TABLE IF NOT EXISTS webhook_events (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id     TEXT REFERENCES tenants(id),
      event_type    TEXT NOT NULL,
      event_id      TEXT,
      employee_id   TEXT,
      employee_name TEXT,
      company_id    TEXT,
      payload       TEXT,
      severity      TEXT DEFAULT 'info',
      status        TEXT DEFAULT 'new',
      acknowledged_by TEXT,
      processed_at  TEXT,
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS api_history (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id       TEXT REFERENCES tenants(id),
      method          TEXT NOT NULL,
      path            TEXT NOT NULL,
      status_code     INTEGER,
      response_ms     INTEGER,
      request_headers TEXT,
      request_body    TEXT,
      response_preview TEXT,
      created_at      TEXT DEFAULT (datetime('now')),
      created_by      TEXT
    );
  `);

  // Seed admin user if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM admin_users').get() as any;
  if (count.c === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admin_users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)').run(
      'admin', hash, 'Administrator', 'admin'
    );
    // Also create chuck user
    db.prepare('INSERT INTO admin_users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)').run(
      'chuck', hash, 'Chuck Britt', 'admin'
    );
    console.log('[DB] Seeded admin users (admin/admin123, chuck/admin123)');
  }

  // Seed demo webhook events if empty
  const evtCount = db.prepare('SELECT COUNT(*) as c FROM webhook_events').get() as any;
  if (evtCount.c === 0) {
    seedDemoEvents(db);
  }
}

function seedDemoEvents(db: Database.Database): void {
  const events = [
    { type: 'ACCOUNT_UPDATED', id: 'evt_001', empId: '12929788445', empName: 'Sarah Barba', cid: '33629692', severity: 'critical', age: '-1 day',
      payload: { fields: { accountNumber: '****7314', routingNumber: '****3021', amount: '100%' }, detail: 'Direct deposit routing + account changed' }},
    { type: 'ACCOUNT_UPDATED', id: 'evt_002', empId: '12929760655', empName: 'Marcus Johnson', cid: '33629692', severity: 'critical', age: '-2 hours',
      payload: { fields: { accountNumber: '****8891', routingNumber: '****4420', amount: '100%' }, detail: 'DD account changed — new bank routing' }},
    { type: 'ACCOUNT_CREATED', id: 'evt_003', empId: '12929801122', empName: 'Jennifer Torres', cid: '33629692', severity: 'warning', age: '-30 minutes',
      payload: { fields: { accountNumber: '****5567', routingNumber: '****1100', amount: '50%' }, detail: 'New split deposit added' }},
    { type: 'ACCOUNT_UPDATED', id: 'evt_004', empId: '12929815533', empName: 'David Chen', cid: '33679548', severity: 'critical', age: '-5 minutes',
      payload: { fields: { accountNumber: '****2200', routingNumber: '****7788', amount: '100%' }, detail: 'DD fully redirected to new account' }},
    { type: 'ACCOUNT_CREATED', id: 'evt_005', empId: '12929822100', empName: 'Lisa Park', cid: '33679548', severity: 'info', age: '-3 days',
      payload: { fields: { accountNumber: '****9933', routingNumber: '****5500', amount: '100%' }, detail: 'Initial DD setup for new hire' }},
  ];

  for (const e of events) {
    db.prepare(`
      INSERT INTO webhook_events (event_type, event_id, employee_id, employee_name, company_id, payload, severity, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'new', datetime('now', ?))
    `).run(e.type, e.id, e.empId, e.empName, e.cid, JSON.stringify(e.payload), e.severity, e.age);
  }
  console.log(`[DB] Seeded ${events.length} demo webhook events`);
}
