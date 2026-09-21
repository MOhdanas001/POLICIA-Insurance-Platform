import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { query } from '../database/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'AGENT' | 'CUSTOMER';
    roleId: string;
    firstName: string;
    lastName: string;
    agentId?: string;
    customerId?: string;
  };
}

export const authenticateJwt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : (req.cookies?.accessToken || req.cookies?.jwt);

    if (!token && req.headers['x-demo-role']) {
      // Demo Header fallback for instantaneous test mode if token is omitted in demo client
      const demoRole = req.headers['x-demo-role'] as string;
      const demoEmails: Record<string, string> = {
        ADMIN: 'admin.demo@example.com',
        AGENT: 'agent.demo@example.com',
        CUSTOMER: 'customer.demo@example.com',
      };
      const email = demoEmails[demoRole.toUpperCase()] || 'admin.demo@example.com';
      const userRes = await query(`
        SELECT u.id, u.email, u.first_name, u.last_name, r.name as role
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.email = $1
      `, [email]);

      if (userRes.rows.length > 0) {
        const u = userRes.rows[0];
        let agentId, customerId;
        if (u.role === 'AGENT') {
          const ag = await query(`SELECT id FROM agents WHERE user_id = $1`, [u.id]);
          agentId = ag.rows[0]?.id;
        } else if (u.role === 'CUSTOMER') {
          const cust = await query(`SELECT id FROM customers WHERE user_id = $1`, [u.id]);
          customerId = cust.rows[0]?.id;
        }
        req.user = {
          id: u.id,
          email: u.email,
          role: u.role,
          roleId: `ROLE_${u.role}`,
          firstName: u.first_name,
          lastName: u.last_name,
          agentId,
          customerId,
        };
        return next();
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.', code: 'UNAUTHORIZED' });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as any;
    
    // Attach additional context if missing
    let agentId = decoded.agentId;
    let customerId = decoded.customerId;

    if (decoded.role === 'AGENT' && !agentId) {
      const ag = await query(`SELECT id FROM agents WHERE user_id = $1`, [decoded.id]);
      agentId = ag.rows[0]?.id;
    } else if (decoded.role === 'CUSTOMER' && !customerId) {
      const cust = await query(`SELECT id FROM customers WHERE user_id = $1`, [decoded.id]);
      customerId = cust.rows[0]?.id;
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      roleId: decoded.roleId || `ROLE_${decoded.role}`,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      agentId,
      customerId,
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token', code: 'INVALID_TOKEN' });
  }
};
