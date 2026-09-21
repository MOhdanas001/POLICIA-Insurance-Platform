import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { query } from '../../database/db';
import { authenticateJwt, AuthRequest } from '../../middleware/auth';

const router = Router();

const generateTokens = (user: {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  agentId?: string;
  customerId?: string;
}) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    roleId: `ROLE_${user.role}`,
    firstName: user.firstName,
    lastName: user.lastName,
    agentId: user.agentId,
    customerId: user.customerId,
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '1d' });
  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

// Login standard
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required', code: 'INVALID_INPUT' });
    }

    const userRes = await query(`
      SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, r.name as role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
    `, [email]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const u = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, u.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    let agentId, customerId;
    if (u.role === 'AGENT') {
      const ag = await query(`SELECT id FROM agents WHERE user_id = $1`, [u.id]);
      agentId = ag.rows[0]?.id;
    } else if (u.role === 'CUSTOMER') {
      const cust = await query(`SELECT id FROM customers WHERE user_id = $1`, [u.id]);
      customerId = cust.rows[0]?.id;
    }

    const userObj = {
      id: u.id,
      email: u.email,
      role: u.role,
      firstName: u.first_name,
      lastName: u.last_name,
      agentId,
      customerId,
    };

    const tokens = generateTokens(userObj);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userObj,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
});

// Demo login handler (1-click for recruiters)
router.post('/demo-login', async (req: Request, res: Response) => {
  try {
    const { role } = req.body; // ADMIN, AGENT, CUSTOMER
    const targetRole = (role || 'CUSTOMER').toUpperCase();

    const demoEmails: Record<string, string> = {
      ADMIN: 'admin.demo@example.com',
      AGENT: 'agent.demo@example.com',
      CUSTOMER: 'customer.demo@example.com',
    };

    const targetEmail = demoEmails[targetRole] || demoEmails.CUSTOMER;

    const userRes = await query(`
      SELECT u.id, u.email, u.first_name, u.last_name, r.name as role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
    `, [targetEmail]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Demo account for role ${targetRole} not found. Please run seed script.`, code: 'DEMO_NOT_FOUND' });
    }

    const u = userRes.rows[0];

    let agentId, customerId;
    if (u.role === 'AGENT') {
      const ag = await query(`SELECT id FROM agents WHERE user_id = $1`, [u.id]);
      agentId = ag.rows[0]?.id;
    } else if (u.role === 'CUSTOMER') {
      const cust = await query(`SELECT id FROM customers WHERE user_id = $1`, [u.id]);
      customerId = cust.rows[0]?.id;
    }

    const userObj = {
      id: u.id,
      email: u.email,
      role: u.role,
      firstName: u.first_name,
      lastName: u.last_name,
      agentId,
      customerId,
    };

    const tokens = generateTokens(userObj);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: `Demo login successful as ${u.first_name} (${u.role})`,
      data: {
        user: userObj,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }
    });
  } catch (err) {
    console.error('Demo login error:', err);
    return res.status(500).json({ success: false, message: 'Demo authentication failed' });
  }
});

// Current User profile
router.get('/me', authenticateJwt, async (req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    data: { user: req.user }
  });
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('accessToken');
  return res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
