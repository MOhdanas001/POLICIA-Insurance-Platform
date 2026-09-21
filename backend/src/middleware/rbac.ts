import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { query } from '../database/db';

export const requireRole = (...allowedRoles: Array<'ADMIN' | 'AGENT' | 'CUSTOMER'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource. Required: [${allowedRoles.join(', ')}]`,
        code: 'FORBIDDEN_ROLE'
      });
    }

    next();
  };
};

export const canAccessCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const targetCustomerId = req.params.customerId || req.params.id || req.body.customerId;
    if (!req.user || !targetCustomerId) {
      return res.status(400).json({ success: false, message: 'Customer ID is required', code: 'INVALID_PARAM' });
    }

    // Admin can access everything
    if (req.user.role === 'ADMIN') return next();

    // Customer can access only own record
    if (req.user.role === 'CUSTOMER') {
      if (req.user.customerId === targetCustomerId) return next();
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own customer data.', code: 'FORBIDDEN_RESOURCE' });
    }

    // Agent can access only assigned customers
    if (req.user.role === 'AGENT') {
      const check = await query(`SELECT agent_id FROM customers WHERE id = $1`, [targetCustomerId]);
      if (check.rows.length > 0 && check.rows[0].agent_id === req.user.agentId) {
        return next();
      }
      return res.status(403).json({ success: false, message: 'Access denied. This customer is not assigned to your agent account.', code: 'FORBIDDEN_RESOURCE' });
    }

    return res.status(403).json({ success: false, message: 'Access denied', code: 'FORBIDDEN' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Authorization check failed', code: 'SERVER_ERROR' });
  }
};

export const canAccessClaim = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const claimId = req.params.claimId || req.params.id || req.body.claimId;
    if (!req.user || !claimId) return next();

    if (req.user.role === 'ADMIN') return next();

    const claimRes = await query(`SELECT customer_id, agent_id FROM claims WHERE id = $1`, [claimId]);
    if (claimRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Claim not found', code: 'NOT_FOUND' });
    }

    const claim = claimRes.rows[0];

    if (req.user.role === 'CUSTOMER') {
      if (claim.customer_id === req.user.customerId) return next();
      return res.status(403).json({ success: false, message: 'Access denied to this claim.', code: 'FORBIDDEN_RESOURCE' });
    }

    if (req.user.role === 'AGENT') {
      if (claim.agent_id === req.user.agentId) return next();
      // Check if customer is assigned to this agent
      const custCheck = await query(`SELECT agent_id FROM customers WHERE id = $1`, [claim.customer_id]);
      if (custCheck.rows.length > 0 && custCheck.rows[0].agent_id === req.user.agentId) return next();

      return res.status(403).json({ success: false, message: 'Access denied. Claim belongs to another agent.', code: 'FORBIDDEN_RESOURCE' });
    }

    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Claim authorization check failed' });
  }
};
