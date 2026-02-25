import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/database';
import { encrypt, decrypt } from '../services/crypto';
import { testAuth, discoverOIDC } from '../services/ukgAuth';
import { requireAuth } from './auth';

export const tenantRoutes = Router();
tenantRoutes.use(requireAuth);

// GET /api/tenants
tenantRoutes.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const tenants = db.prepare(`
    SELECT id, name, company_short, company_id, base_url, username,
           status, last_auth_test, last_error, created_at, updated_at
    FROM tenants ORDER BY name
  `).all();
  res.json(tenants);
});

// GET /api/tenants/:id
tenantRoutes.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const tenant = db.prepare(`
    SELECT id, name, company_short, company_id, base_url, username,
           auth_endpoint, token_endpoint, status, last_auth_test, last_error,
           created_at, updated_at
    FROM tenants WHERE id = ?
  `).get(req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  res.json(tenant);
});

// POST /api/tenants
tenantRoutes.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { name, company_short, base_url, api_key, username, password } = req.body;

  if (!name || !company_short || !base_url || !api_key || !username || !password) {
    return res.status(400).json({ error: 'All fields required: name, company_short, base_url, api_key, username, password' });
  }

  const id = uuid();
  const apiKeyEnc = encrypt(api_key);
  const passwordEnc = encrypt(password);

  db.prepare(`
    INSERT INTO tenants (id, name, company_short, base_url, api_key_enc, username, password_enc, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(id, name, company_short, base_url, apiKeyEnc, username, passwordEnc, (req.session as any).username || 'system');

  // Log activity
  db.prepare(`
    INSERT INTO activity_log (tenant_id, action, detail, status, created_at, created_by)
    VALUES (?, 'tenant_created', ?, 'success', datetime('now'), ?)
  `).run(id, JSON.stringify({ name, company_short }), (req.session as any).username);

  res.json({ success: true, id });
});

// PUT /api/tenants/:id
tenantRoutes.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const { id } = req.params;
  const { name, company_short, base_url, api_key, username, password } = req.body;

  const existing = db.prepare('SELECT id FROM tenants WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Tenant not found' });

  const updates: string[] = [];
  const params: any[] = [];

  if (name) { updates.push('name = ?'); params.push(name); }
  if (company_short) { updates.push('company_short = ?'); params.push(company_short); }
  if (base_url) { updates.push('base_url = ?'); params.push(base_url); }
  if (username) { updates.push('username = ?'); params.push(username); }
  if (api_key) { updates.push('api_key_enc = ?'); params.push(encrypt(api_key)); }
  if (password) { updates.push('password_enc = ?'); params.push(encrypt(password)); }

  updates.push("updated_at = datetime('now')");
  params.push(id);

  db.prepare(`UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  res.json({ success: true });
});

// DELETE /api/tenants/:id (soft delete)
tenantRoutes.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare("UPDATE tenants SET status = 'inactive', updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// POST /api/tenants/:id/test-auth
tenantRoutes.post('/:id/test-auth', async (req: Request, res: Response) => {
  const db = getDb();
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id) as any;
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  const apiKey = decrypt(tenant.api_key_enc);
  const password = decrypt(tenant.password_enc);

  const result = await testAuth(tenant.base_url, apiKey, tenant.username, password, tenant.company_short);

  // Update tenant status
  if (result.success) {
    const companyId = result.decoded?.cid || tenant.company_id || '';
    db.prepare(`
      UPDATE tenants SET status = 'active', company_id = ?, last_auth_test = datetime('now'), last_error = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).run(companyId, tenant.id);
  } else {
    db.prepare(`
      UPDATE tenants SET status = 'error', last_error = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(result.error || 'Unknown error', tenant.id);
  }

  // Log activity
  db.prepare(`
    INSERT INTO activity_log (tenant_id, action, detail, status, response_ms, created_at, created_by)
    VALUES (?, 'auth_test', ?, ?, ?, datetime('now'), ?)
  `).run(
    tenant.id,
    JSON.stringify({ decoded: result.decoded }),
    result.success ? 'success' : 'error',
    result.responseMs,
    (req.session as any).username
  );

  res.json(result);
});

// POST /api/tenants/:id/discover
tenantRoutes.post('/:id/discover', async (req: Request, res: Response) => {
  const db = getDb();
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.params.id) as any;
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  if (!tenant.company_id) return res.status(400).json({ error: 'Company ID not set. Run auth test first.' });

  const apiKey = decrypt(tenant.api_key_enc);
  const password = decrypt(tenant.password_enc);

  // Get a fresh token
  const authResult = await testAuth(tenant.base_url, apiKey, tenant.username, password, tenant.company_short);
  if (!authResult.success || !authResult.token) {
    return res.status(500).json({ error: `Auth failed: ${authResult.error}` });
  }

  const result = await discoverOIDC(tenant.base_url, tenant.company_id, authResult.token);

  if (result.success && result.data) {
    db.prepare(`
      UPDATE tenants SET auth_endpoint = ?, token_endpoint = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      result.data.authorization_endpoint || null,
      result.data.token_endpoint || null,
      tenant.id
    );
  }

  // Log activity
  db.prepare(`
    INSERT INTO activity_log (tenant_id, action, detail, status, response_ms, created_at, created_by)
    VALUES (?, 'oidc_discovery', ?, ?, ?, datetime('now'), ?)
  `).run(
    tenant.id,
    JSON.stringify(result.data || { error: result.error }),
    result.success ? 'success' : 'error',
    result.responseMs,
    (req.session as any).username
  );

  res.json(result);
});
