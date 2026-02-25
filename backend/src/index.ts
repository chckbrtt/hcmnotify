import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import dotenv from 'dotenv';
import { getDb, closeDb } from './db/database';
import { authRoutes } from './routes/auth';
import { tenantRoutes } from './routes/tenants';
import { explorerRoutes } from './routes/explorer';
import { activityRoutes } from './routes/activity';
import { eventRoutes, webhookReceiver } from './routes/events';
import { analysisRoutes } from './routes/analysis';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000');

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'hcmnotify-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
  },
}));

// Public routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  const db = getDb();
  const tenants = (db.prepare('SELECT COUNT(*) as c FROM tenants').get() as any).c;
  res.json({ status: 'ok', version: '0.1.0', tenants, timestamp: new Date().toISOString() });
});

// No-cache for API
app.use('/api', (_req, res, next) => {
  res.set({ 'Cache-Control': 'no-store', 'Pragma': 'no-cache', 'Expires': '0' });
  next();
});

// Protected routes
app.use('/api/tenants', tenantRoutes);
app.use('/api/explorer', explorerRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api', webhookReceiver);

// Serve frontend
const frontendPath = path.join(__dirname, '..', 'public');
app.use(express.static(frontendPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start
app.listen(PORT, '0.0.0.0', () => {
  getDb();
  console.log(`\n🔔 HCMNotify Admin Portal running on http://0.0.0.0:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});

process.on('SIGTERM', () => { closeDb(); process.exit(0); });
