import { Router, Request, Response } from 'express';
import { requireAuth } from './auth';
import { getDb } from '../db/database';

export const analysisRoutes = Router();
analysisRoutes.use(requireAuth);

// GET /api/analysis/patterns — pattern detection on recent events
analysisRoutes.get('/patterns', (_req: Request, res: Response) => {
  const db = getDb();

  const events = db.prepare(`
    SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 100
  `).all() as any[];

  const patterns: any[] = [];

  // Pattern 1: Multiple DD changes for same employee
  const byEmployee = new Map<string, any[]>();
  for (const e of events) {
    if (!byEmployee.has(e.employee_id)) byEmployee.set(e.employee_id, []);
    byEmployee.get(e.employee_id)!.push(e);
  }
  for (const [empId, evts] of byEmployee) {
    if (evts.length > 1) {
      patterns.push({
        type: 'REPEAT_CHANGE',
        severity: 'critical',
        title: 'Repeated DD Changes',
        description: `${evts[0].employee_name} (${empId}) has ${evts.length} DD changes in recent history. Possible payroll fraud indicator.`,
        employees: evts.map(e => ({ name: e.employee_name, event: e.event_type, date: e.created_at })),
        recommendation: 'Verify with employee and payroll department. Cross-reference with IP/device logs if available.',
      });
    }
  }

  // Pattern 2: Cluster of changes (3+ in same day)
  const byDate = new Map<string, any[]>();
  for (const e of events) {
    const date = (e.created_at || '').split('T')[0] || (e.created_at || '').split(' ')[0];
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(e);
  }
  for (const [date, evts] of byDate) {
    if (evts.length >= 3) {
      patterns.push({
        type: 'CLUSTER',
        severity: 'warning',
        title: 'Change Cluster Detected',
        description: `${evts.length} DD changes detected on ${date}. Unusual volume may indicate a coordinated attack or system issue.`,
        count: evts.length,
        date,
        recommendation: 'Review all changes for this date. Check if they originate from the same IP or session.',
      });
    }
  }

  // Pattern 3: 100% redirect (most suspicious)
  for (const e of events) {
    try {
      const payload = JSON.parse(e.payload || '{}');
      if (payload.fields?.amount === '100%' && e.event_type === 'ACCOUNT_UPDATED') {
        patterns.push({
          type: 'FULL_REDIRECT',
          severity: 'critical',
          title: '100% Deposit Redirect',
          description: `${e.employee_name}'s entire paycheck redirected to new account (${payload.fields.accountNumber}). This is the highest-risk DD change pattern.`,
          employee: e.employee_name,
          accountNumber: payload.fields.accountNumber,
          recommendation: 'IMMEDIATE ACTION: Contact employee to verify. Place payroll hold if unverified within 24 hours.',
        });
      }
    } catch {}
  }

  // Deduplicate by type+employee
  const seen = new Set<string>();
  const unique = patterns.filter(p => {
    const key = `${p.type}-${p.employee || p.date || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  res.json({
    patterns: unique,
    summary: {
      total: unique.length,
      critical: unique.filter(p => p.severity === 'critical').length,
      warning: unique.filter(p => p.severity === 'warning').length,
    },
    analyzedEvents: events.length,
  });
});
