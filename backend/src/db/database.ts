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
    console.log('[DB] Seeded admin user (admin/admin123)');
  }
}
