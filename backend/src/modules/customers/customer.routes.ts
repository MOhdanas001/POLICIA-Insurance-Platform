import { Router, Response } from 'express';
import { query } from '../../database/db';
import { authenticateJwt, AuthRequest } from '../../middleware/auth';
import { canAccessCustomer, requireRole } from '../../middleware/rbac';

const router = Router();

// List Customers (Admin sees all, Agent sees assigned)
router.get('/', authenticateJwt, requireRole('ADMIN', 'AGENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { search, agentId, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (req.user?.role === 'AGENT') {
      params.push(req.user.agentId);
      whereClause += ` AND c.agent_id = $${params.length}`;
    } else if (agentId) {
      params.push(agentId);
      whereClause += ` AND c.agent_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR c.phone ILIKE $${params.length})`;
    }

    const countRes = await query(`
      SELECT COUNT(*)
      FROM customers c
      JOIN users u ON c.user_id = u.id
      ${whereClause}
    `, params);

    const total = parseInt(countRes.rows[0].count, 10);

    params.push(Number(limit), offset);
    const custRes = await query(`
      SELECT c.*, u.first_name, u.last_name, u.email, u.avatar_url,
        ag.employee_id as agent_employee_id,
        au.first_name || ' ' || au.last_name as agent_name,
        (SELECT COUNT(*) FROM customer_policies cp WHERE cp.customer_id = c.id AND cp.status = 'ACTIVE') as active_policies_count,
        (SELECT COUNT(*) FROM claims cl WHERE cl.customer_id = c.id AND cl.status NOT IN ('CLOSED', 'REJECTED')) as open_claims_count
      FROM customers c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN agents ag ON c.agent_id = ag.id
      LEFT JOIN users au ON ag.user_id = au.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    return res.json({
      success: true,
      data: {
        customers: custRes.rows,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (err) {
    console.error('List customers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
});

// GET Customer by ID
router.get('/:id', authenticateJwt, canAccessCustomer, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const custRes = await query(`
      SELECT c.*, u.first_name, u.last_name, u.email, u.avatar_url, u.created_at as member_since,
        ag.id as agent_id, ag.employee_id as agent_employee_id, ag.department as agent_dept,
        au.first_name || ' ' || au.last_name as agent_name, au.email as agent_email
      FROM customers c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN agents ag ON c.agent_id = ag.id
      LEFT JOIN users au ON ag.user_id = au.id
      WHERE c.id = $1
    `, [id]);

    if (custRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found', code: 'NOT_FOUND' });
    }

    const customer = custRes.rows[0];

    // Customer policies
    const cpRes = await query(`
      SELECT cp.*, p.name as policy_name, p.policy_type, p.terms_conditions, p.exclusions, p.benefits
      FROM customer_policies cp
      JOIN policies p ON cp.policy_id = p.id
      WHERE cp.customer_id = $1
      ORDER BY cp.created_at DESC
    `, [id]);

    // Customer claims
    const clRes = await query(`
      SELECT cl.*, p.name as policy_name
      FROM claims cl
      JOIN policies p ON cl.policy_id = p.id
      WHERE cl.customer_id = $1
      ORDER BY cl.created_at DESC
    `, [id]);

    // Customer installments
    const instRes = await query(`
      SELECT i.*, cp.policy_number, p.name as policy_name
      FROM installments i
      JOIN payment_plans pp ON i.payment_plan_id = pp.id
      JOIN customer_policies cp ON pp.customer_policy_id = cp.id
      JOIN policies p ON cp.policy_id = p.id
      WHERE i.customer_id = $1
      ORDER BY i.due_date ASC
    `, [id]);

    return res.json({
      success: true,
      data: {
        customer,
        policies: cpRes.rows,
        claims: clRes.rows,
        installments: instRes.rows
      }
    });
  } catch (err) {
    console.error('Customer detail error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch customer detail' });
  }
});

// GET Customer Policies
router.get('/:id/policies', authenticateJwt, canAccessCustomer, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const cpRes = await query(`
      SELECT cp.*, p.name as policy_name, p.policy_type, p.description, p.terms_conditions, p.exclusions, p.benefits, p.claim_requirements
      FROM customer_policies cp
      JOIN policies p ON cp.policy_id = p.id
      WHERE cp.customer_id = $1
      ORDER BY cp.created_at DESC
    `, [id]);

    return res.json({ success: true, data: { policies: cpRes.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customer policies' });
  }
});

export default router;
