import { Router, Request, Response } from 'express';
import { requireAuth } from './auth';
import { proxyRequest } from '../services/ukgProxy';
import { getDb } from '../db/database';

export const explorerRoutes = Router();
explorerRoutes.use(requireAuth);

// POST /api/explorer/request — proxy a request to UKG
explorerRoutes.post('/request', async (req: Request, res: Response) => {
  const { tenantId, method, path, headers, body, accept } = req.body;

  if (!tenantId || !method || !path) {
    return res.status(400).json({ error: 'tenantId, method, and path are required' });
  }

  try {
    const result = await proxyRequest({ tenantId, method, path, headers, body, accept });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/explorer/history/:tenantId
explorerRoutes.get('/history/:tenantId', (req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, method, path, status_code, response_ms, created_at
    FROM api_history
    WHERE tenant_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.params.tenantId);
  res.json(rows);
});

// GET /api/explorer/presets — return preset endpoint categories
explorerRoutes.get('/presets', (_req: Request, res: Response) => {
  res.json({
    categories: [
      {
        name: 'Reports (v1)',
        icon: '📋',
        endpoints: [
          { name: 'DD Changes Saved Report', method: 'GET', path: '/v1/report/saved/44461451', accept: 'text/csv', description: 'Direct deposit change audit report (Axiom tenant)' },
          { name: 'Employee Roster', method: 'GET', path: '/v1/report/saved/43994775', accept: 'text/csv', description: 'Full employee roster with pay rates, job titles, locations' },
          { name: 'Time Entry Detail', method: 'GET', path: '/v1/report/saved/43994778', accept: 'text/csv', description: 'Time entries with punch in/out, hours, locations' },
          { name: 'Custom Report', method: 'GET', path: '/v1/report/saved/{reportId}', accept: 'text/csv', params: [{ name: 'reportId', label: 'Report ID', required: true }] },
        ],
      },
      {
        name: 'Employees (v2)',
        icon: '👤',
        endpoints: [
          { name: 'List Employees', method: 'GET', path: '/v2/companies/{cid}/employees', accept: 'application/json' },
          { name: 'Get Employee', method: 'GET', path: '/v2/companies/{cid}/employees/{employeeId}', accept: 'application/json', params: [{ name: 'employeeId', label: 'Employee ID', required: true }] },
        ],
      },
      {
        name: 'Time & Attendance (v2)',
        icon: '⏰',
        endpoints: [
          { name: 'Time Entries', method: 'GET', path: '/v2/companies/{cid}/time-management/time-entries', accept: 'application/json' },
          { name: 'Punches', method: 'GET', path: '/v2/companies/{cid}/time-management/punches', accept: 'application/json' },
        ],
      },
      {
        name: 'Webhooks (v2)',
        icon: '🔔',
        endpoints: [
          { name: 'List Subscriptions', method: 'GET', path: '/v2/companies/{cid}/webhook-subscriptions', accept: 'application/json' },
        ],
      },
      {
        name: 'Discovery',
        icon: '🔍',
        endpoints: [
          { name: 'OIDC Configuration', method: 'GET', path: '/v2/companies/{cid}/oauth2/.well-known/openid-configuration', accept: 'application/json' },
        ],
      },
    ],
  });
});
