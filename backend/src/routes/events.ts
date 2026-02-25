import { Router, Request, Response } from 'express';
import { requireAuth } from './auth';
import { getDb } from '../db/database';

export const eventRoutes = Router();
eventRoutes.use(requireAuth);

// GET /api/events — list webhook events
eventRoutes.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const limit = parseInt(req.query.limit as string) || 50;
  const severity = req.query.severity as string;
  const status = req.query.status as string;

  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (severity) { where += ' AND e.severity = ?'; params.push(severity); }
  if (status) { where += ' AND e.status = ?'; params.push(status); }

  params.push(limit);

  const rows = db.prepare(`
    SELECT e.*, t.name as tenant_name
    FROM webhook_events e
    LEFT JOIN tenants t ON e.tenant_id = t.id
    ${where}
    ORDER BY e.created_at DESC
    LIMIT ?
  `).all(...params);

  res.json(rows);
});

// GET /api/events/stats
eventRoutes.get('/stats', (_req: Request, res: Response) => {
  const db = getDb();

  const total = (db.prepare('SELECT COUNT(*) as c FROM webhook_events').get() as any).c;
  const critical = (db.prepare("SELECT COUNT(*) as c FROM webhook_events WHERE severity = 'critical'").get() as any).c;
  const unacknowledged = (db.prepare("SELECT COUNT(*) as c FROM webhook_events WHERE status = 'new'").get() as any).c;
  const today = (db.prepare("SELECT COUNT(*) as c FROM webhook_events WHERE created_at >= date('now')").get() as any).c;

  res.json({ total, critical, unacknowledged, today });
});

// POST /api/events/:id/acknowledge
eventRoutes.post('/:id/acknowledge', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare(`
    UPDATE webhook_events SET status = 'acknowledged', acknowledged_by = ?, processed_at = datetime('now')
    WHERE id = ?
  `).run((req.session as any).username, req.params.id);
  res.json({ success: true });
});

// POST /api/events/webhook — incoming webhook receiver (no auth required for external)
export const webhookReceiver = Router();
webhookReceiver.post('/webhook/ukg', (req: Request, res: Response) => {
  const db = getDb();
  const body = req.body;

  // Parse UKG webhook payload
  const eventType = body.eventType || body.event_type || 'UNKNOWN';
  const employeeId = body.employeeId || body.employee_id || '';
  const employeeName = body.employeeName || body.employee_name || '';
  const companyId = body.companyId || body.company_id || '';

  let severity = 'info';
  if (eventType === 'ACCOUNT_UPDATED') severity = 'critical';
  else if (eventType === 'ACCOUNT_CREATED') severity = 'warning';

  db.prepare(`
    INSERT INTO webhook_events (event_type, event_id, employee_id, employee_name, company_id, payload, severity, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'new', datetime('now'))
  `).run(eventType, body.eventId || null, employeeId, employeeName, companyId, JSON.stringify(body), severity);

  res.json({ received: true });
});
