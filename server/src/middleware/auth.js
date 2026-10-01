import jwt from 'jsonwebtoken';
import { db } from '../db.js';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret';

export function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { userId } = jwt.verify(token, JWT_SECRET);
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    req.user = user;
    next();
  } catch {
    res.clearCookie('token');
    res.status(401).json({ error: 'Session expired, please log in again' });
  }
}
