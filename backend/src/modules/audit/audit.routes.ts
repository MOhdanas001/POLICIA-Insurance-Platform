import { Router, Response } from 'express';
import { query } from '../../database/db';
import { authenticateJwt, AuthRequest } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

const router = Router();

// GET System Audit Logs (Admin only)
router.get('/', authenticateJwt, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { action, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (action && action !== 'ALL') {
      params.push(action);
      whereClause += ` AND al.action = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (al.resource ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.first_name ILIKE $${params.length})`;
    }

    const countRes = await query(`
      SELECT COUNT(*)
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
    `, params);

    const total = parseInt(countRes.rows[0].count, 10);

    params.push(Number(limit), offset);
    const logsRes = await query(`
      SELECT al.*, u.first_name || ' ' || u.last_name as user_name, u.email as user_email, r.name as role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    return res.json({
      success: true,
      data: {
        logs: logsRes.rows,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (err) {
    console.error('Audit logs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

export default router;
