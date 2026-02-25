import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/database';

export const authRoutes = Router();

// POST /api/auth/login
authRoutes.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username.toLowerCase()) as any;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Update last login
  db.prepare("UPDATE admin_users SET last_login = datetime('now') WHERE id = ?").run(user.id);

  // Set session
  (req.session as any).userId = user.id;
  (req.session as any).username = user.username;
  (req.session as any).role = user.role;

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
    },
  });
});

// POST /api/auth/logout
authRoutes.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {});
  res.json({ success: true });
});

// GET /api/auth/me
authRoutes.get('/me', (req: Request, res: Response) => {
  if (!(req.session as any).userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({
    id: (req.session as any).userId,
    username: (req.session as any).username,
    role: (req.session as any).role,
  });
});

// Middleware: require auth
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any).userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}
