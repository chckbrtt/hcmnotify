/**
 * UKG API Proxy — forwards requests through our backend so credentials never hit the browser.
 */
import { decrypt } from './crypto';
import { testAuth } from './ukgAuth';
import { getDb } from '../db/database';

interface ProxyRequest {
  tenantId: string;
  method: string;
  path: string;       // e.g., "/v1/report/saved/43994775" or "/v2/companies/{cid}/employees"
  headers?: Record<string, string>;
  body?: string;
  accept?: string;    // Override Accept header (e.g., "text/csv")
}

interface ProxyResponse {
  success: boolean;
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  responseMs: number;
  error?: string;
}

// Token cache: tenantId → { token, expiresAt }
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function getToken(tenantId: string): Promise<string> {
  const cached = tokenCache.get(tenantId);
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  const db = getDb();
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId) as any;
  if (!tenant) throw new Error('Tenant not found');

  const apiKey = decrypt(tenant.api_key_enc);
  const password = decrypt(tenant.password_enc);

  const result = await testAuth(tenant.base_url, apiKey, tenant.username, password, tenant.company_short);
  if (!result.success || !result.token) {
    throw new Error(`Auth failed: ${result.error}`);
  }

  tokenCache.set(tenantId, { token: result.token, expiresAt: Date.now() + 3500_000 });
  return result.token;
}

export async function proxyRequest(req: ProxyRequest): Promise<ProxyResponse> {
  const db = getDb();
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(req.tenantId) as any;
  if (!tenant) {
    return { success: false, statusCode: 404, headers: {}, body: 'Tenant not found', contentType: 'text/plain', responseMs: 0, error: 'Tenant not found' };
  }

  const cleanBase = tenant.base_url.replace(/\/+$/, '').replace(/\/v[12]\/?$/, '');
  const token = await getToken(req.tenantId);

  // Replace {cid} placeholder with actual company ID
  let path = req.path.replace(/\{cid\}/g, tenant.company_id || '');

  const url = `${cleanBase}${path}`;
  const start = Date.now();

  try {
    const fetchHeaders: Record<string, string> = {
      'Authentication': `Bearer ${token}`,
      'Accept': req.accept || 'application/json',
      ...(req.headers || {}),
    };

    if (req.body && req.method !== 'GET') {
      fetchHeaders['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
      method: req.method,
      headers: fetchHeaders,
      body: req.method !== 'GET' ? req.body : undefined,
    });

    const responseMs = Date.now() - start;
    const contentType = res.headers.get('content-type') || 'text/plain';
    const body = await res.text();

    // Log to history
    db.prepare(`
      INSERT INTO api_history (tenant_id, method, path, status_code, response_ms, response_preview, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(req.tenantId, req.method, req.path, res.status, responseMs, body.substring(0, 1000));

    // Log activity
    db.prepare(`
      INSERT INTO activity_log (tenant_id, action, detail, status, response_ms, created_at)
      VALUES (?, 'api_call', ?, ?, ?, datetime('now'))
    `).run(req.tenantId, JSON.stringify({ method: req.method, path: req.path }), res.ok ? 'success' : 'error', responseMs);

    const respHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => { respHeaders[k] = v; });

    return {
      success: res.ok,
      statusCode: res.status,
      headers: respHeaders,
      body,
      contentType,
      responseMs,
    };
  } catch (err: any) {
    const responseMs = Date.now() - start;
    return {
      success: false,
      statusCode: 0,
      headers: {},
      body: '',
      contentType: 'text/plain',
      responseMs,
      error: err.message,
    };
  }
}
