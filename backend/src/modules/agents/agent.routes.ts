import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../../database/db';
import { authenticateJwt, AuthRequest } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

const router = Router();

// GET all agents (Admin)
router.get('/', authenticateJwt, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const agentsRes = await query(`
      SELECT ag.*, u.first_name, u.last_name, u.email, u.avatar_url,
        (SELECT COUNT(*) FROM customers c WHERE c.agent_id = ag.id) as assigned_customers_count,
        (SELECT COUNT(*) FROM claims cl WHERE cl.agent_id = ag.id AND cl.status NOT IN ('CLOSED', 'REJECTED')) as open_claims_count
      FROM agents ag
      JOIN users u ON ag.user_id = u.id
      ORDER BY ag.created_at DESC
    `);

    return res.json({ success: true, data: { agents: agentsRes.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch agents' });
  }
});

// POST Admin create agent
router.post('/', authenticateJwt, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, email, password, department } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'All agent user details are required', code: 'INVALID_INPUT' });
    }

    const passHash = await bcrypt.hash(password, 10);
    const uRes = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role_id)
      VALUES ($1, $2, $3, $4, 'ROLE_AGENT')
      RETURNING id;
    `, [email, passHash, firstName, lastName]);

    const empId = `AGT-${Math.floor(1000 + Math.random() * 9000)}`;
    const agRes = await query(`
      INSERT INTO agents (user_id, employee_id, department, status)
      VALUES ($1, $2, $3, 'ACTIVE')
      RETURNING *;
    `, [uRes.rows[0].id, empId, department || 'General Insurance']);

    await query(`
      INSERT INTO audit_logs (user_id, action, resource, resource_id, new_value)
      VALUES ($1, 'CREATE_AGENT', 'Agent', $2, $3::jsonb);
    `, [req.user?.id, agRes.rows[0].id, JSON.stringify(agRes.rows[0])]);

    return res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      data: { agent: agRes.rows[0] }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to create agent account' });
  }
});

// Assign customer to agent
router.post('/:id/assign-customer', authenticateJwt, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { customerId } = req.body;

    if (!customerId) return res.status(400).json({ success: false, message: 'Customer ID required' });

    await query(`UPDATE customers SET agent_id = $1 WHERE id = $2`, [id, customerId]);

    // Also update agent on customer claims if needed
    await query(`UPDATE claims SET agent_id = $1 WHERE customer_id = $2 AND status NOT IN ('CLOSED', 'REJECTED')`, [id, customerId]);

    await query(`
      INSERT INTO audit_logs (user_id, action, resource, resource_id, new_value)
      VALUES ($1, 'ASSIGN_CUSTOMER_AGENT', 'Customer', $2, $3::jsonb);
    `, [req.user?.id, customerId, JSON.stringify({ agentId: id, customerId })]);

    return res.json({ success: true, message: 'Customer assigned to agent successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to assign customer to agent' });
  }
});

export default router;
