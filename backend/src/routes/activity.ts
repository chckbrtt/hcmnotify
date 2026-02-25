import { Router, Request, Response } from 'express';
import { requireAuth } from './auth';
import { getDb } from '../db/database';

export const activityRoutes = Router();
activityRoutes.use(requireAuth);

// GET /api/activity — recent activity across all tenants
activityRoutes.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const limit = parseInt(req.query.limit as string) || 20;

  const rows = db.prepare(`
    SELECT a.*, t.name as tenant_name
    FROM activity_log a
    LEFT JOIN tenants t ON a.tenant_id = t.id
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(limit);

  res.json(rows);
});

// GET /api/activity/stats — dashboard stats
activityRoutes.get('/stats', (_req: Request, res: Response) => {
  const db = getDb();

  const totalTenants = (db.prepare("SELECT COUNT(*) as c FROM tenants WHERE status != 'inactive'").get() as any).c;
  const activeTenants = (db.prepare("SELECT COUNT(*) as c FROM tenants WHERE status = 'active'").get() as any).c;
  const errorTenants = (db.prepare("SELECT COUNT(*) as c FROM tenants WHERE status = 'error'").get() as any).c;
  const pendingTenants = (db.prepare("SELECT COUNT(*) as c FROM tenants WHERE status = 'pending'").get() as any).c;
  const totalApiCalls = (db.prepare("SELECT COUNT(*) as c FROM api_history").get() as any).c;
  const todayApiCalls = (db.prepare("SELECT COUNT(*) as c FROM api_history WHERE created_at >= date('now')").get() as any).c;

  const recentActivity = db.prepare(`
    SELECT a.*, t.name as tenant_name
    FROM activity_log a
    LEFT JOIN tenants t ON a.tenant_id = t.id
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all();

  res.json({
    tenants: { total: totalTenants, active: activeTenants, error: errorTenants, pending: pendingTenants },
    apiCalls: { total: totalApiCalls, today: todayApiCalls },
    recentActivity,
  });
});
