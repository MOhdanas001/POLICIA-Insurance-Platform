import { Router, Response } from 'express';
import { query } from '../../database/db';
import { authenticateJwt, AuthRequest } from '../../middleware/auth';
import { canAccessClaim, requireRole } from '../../middleware/rbac';

const router = Router();

// State Machine transitions map
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['DOCUMENT_REQUIRED', 'INVESTIGATION', 'APPROVED', 'REJECTED'],
  DOCUMENT_REQUIRED: ['UNDER_REVIEW', 'REJECTED'],
  INVESTIGATION: ['APPROVED', 'REJECTED'],
  APPROVED: ['SETTLEMENT', 'CLOSED'],
  SETTLEMENT: ['CLOSED'],
  REJECTED: [],
  CLOSED: []
};

// GET all claims with role scoping
router.get('/', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (req.user?.role === 'CUSTOMER') {
      params.push(req.user.customerId);
      whereClause += ` AND cl.customer_id = $${params.length}`;
    } else if (req.user?.role === 'AGENT') {
      params.push(req.user.agentId);
      whereClause += ` AND cl.agent_id = $${params.length}`;
    }

    if (status && status !== 'ALL') {
      params.push(status);
      whereClause += ` AND cl.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (cl.claim_number ILIKE $${params.length} OR p.name ILIKE $${params.length} OR u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length})`;
    }

    const countRes = await query(`
      SELECT COUNT(*)
      FROM claims cl
      JOIN policies p ON cl.policy_id = p.id
      JOIN customers c ON cl.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      ${whereClause}
    `, params);

    const total = parseInt(countRes.rows[0].count, 10);

    params.push(Number(limit), offset);
    const claimsRes = await query(`
      SELECT cl.*, p.name as policy_name, p.policy_type,
        u.first_name || ' ' || u.last_name as customer_name, u.email as customer_email,
        au.first_name || ' ' || au.last_name as agent_name
      FROM claims cl
      JOIN policies p ON cl.policy_id = p.id
      JOIN customers c ON cl.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      LEFT JOIN agents ag ON cl.agent_id = ag.id
      LEFT JOIN users au ON ag.user_id = au.id
      ${whereClause}
      ORDER BY cl.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    return res.json({
      success: true,
      data: {
        claims: claimsRes.rows,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (err) {
    console.error('Fetch claims error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch claims' });
  }
});

// GET claim detail by ID
router.get('/:id', authenticateJwt, canAccessClaim, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const claimRes = await query(`
      SELECT cl.*, p.name as policy_name, p.policy_type, p.policy_number as master_policy_number,
        cp.policy_number as customer_policy_number, cp.coverage_amount,
        u.first_name || ' ' || u.last_name as customer_name, u.email as customer_email, c.phone as customer_phone,
        au.first_name || ' ' || au.last_name as agent_name, au.email as agent_email
      FROM claims cl
      JOIN policies p ON cl.policy_id = p.id
      JOIN customer_policies cp ON cl.customer_policy_id = cp.id
      JOIN customers c ON cl.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      LEFT JOIN agents ag ON cl.agent_id = ag.id
      LEFT JOIN users au ON ag.user_id = au.id
      WHERE cl.id = $1
    `, [id]);

    if (claimRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Claim not found', code: 'NOT_FOUND' });
    }

    const claim = claimRes.rows[0];

    // Timeline history
    const historyRes = await query(`
      SELECT h.*, u.first_name || ' ' || u.last_name as actor_name, r.name as actor_role
      FROM claim_status_history h
      LEFT JOIN users u ON h.changed_by = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE h.claim_id = $1
      ORDER BY h.created_at ASC
    `, [id]);

    // Claim documents
    const docRes = await query(`
      SELECT cd.*, u.first_name || ' ' || u.last_name as uploader_name
      FROM claim_documents cd
      LEFT JOIN users u ON cd.uploaded_by = u.id
      WHERE cd.claim_id = $1
      ORDER BY cd.created_at DESC
    `, [id]);

    const allowedNextStatuses = VALID_TRANSITIONS[claim.status] || [];

    return res.json({
      success: true,
      data: {
        claim,
        timeline: historyRes.rows,
        documents: docRes.rows,
        allowedNextStatuses
      }
    });
  } catch (err) {
    console.error('Claim detail error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch claim details' });
  }
});

// POST Customer Apply for Claim
router.post('/', authenticateJwt, requireRole('CUSTOMER'), async (req: AuthRequest, res: Response) => {
  try {
    const { customerPolicyId, claimType, incidentDate, description, claimAmount, documents } = req.body;

    if (!customerPolicyId || !claimType || !incidentDate || !description || !claimAmount) {
      return res.status(400).json({ success: false, message: 'Missing required claim details', code: 'INVALID_INPUT' });
    }

    // Check policy ownership
    const cpRes = await query(`
      SELECT cp.*, c.agent_id
      FROM customer_policies cp
      JOIN customers c ON cp.customer_id = c.id
      WHERE cp.id = $1 AND cp.customer_id = $2
    `, [customerPolicyId, req.user?.customerId]);

    if (cpRes.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Invalid customer policy selection' });
    }

    const cp = cpRes.rows[0];
    const claimNum = `CLM-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const clRes = await query(`
      INSERT INTO claims (
        claim_number, customer_id, customer_policy_id, policy_id, agent_id,
        claim_type, incident_date, description, claim_amount, approved_amount, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 'SUBMITTED')
      RETURNING *;
    `, [
      claimNum, req.user?.customerId, cp.id, cp.policy_id, cp.agent_id,
      claimType, incidentDate, description, claimAmount
    ]);

    const newClaim = clRes.rows[0];

    // Initial timeline record
    await query(`
      INSERT INTO claim_status_history (claim_id, previous_status, new_status, changed_by, comments)
      VALUES ($1, NULL, 'SUBMITTED', $2, 'Claim application submitted by customer via portal.');
    `, [newClaim.id, req.user?.id]);

    // Handle document attachments
    if (Array.isArray(documents) && documents.length > 0) {
      for (const doc of documents) {
        await query(`
          INSERT INTO claim_documents (claim_id, name, file_type, file_url, file_size, uploaded_by)
          VALUES ($1, $2, $3, $4, $5, $6);
        `, [newClaim.id, doc.name || 'Claim Document', doc.type || 'PDF', doc.url || '/uploads/sample.pdf', doc.size || 1024, req.user?.id]);
      }
    }

    // Audit log
    await query(`
      INSERT INTO audit_logs (user_id, action, resource, resource_id, new_value)
      VALUES ($1, 'SUBMIT_CLAIM', 'Claim', $2, $3::jsonb);
    `, [req.user?.id, newClaim.id, JSON.stringify(newClaim)]);

    return res.status(201).json({
      success: true,
      message: 'Claim submitted successfully',
      data: { claim: newClaim }
    });
  } catch (err: any) {
    console.error('Submit claim error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit claim' });
  }
});

// PATCH Agent/Admin Update Claim Status (State Machine Enforcement)
router.patch('/:id/status', authenticateJwt, requireRole('ADMIN', 'AGENT'), canAccessClaim, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newStatus, comments, approvedAmount } = req.body;

    const currentRes = await query(`SELECT status, claim_amount FROM claims WHERE id = $1`, [id]);
    if (currentRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Claim not found' });

    const currentStatus = currentRes.rows[0].status;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition from '${currentStatus}' to '${newStatus}'. Allowed: [${allowed.join(', ')}]`,
        code: 'INVALID_STATE_TRANSITION'
      });
    }

    let appAmt = 0;
    if (newStatus === 'APPROVED' || newStatus === 'SETTLEMENT' || newStatus === 'CLOSED') {
      appAmt = approvedAmount !== undefined ? approvedAmount : currentRes.rows[0].claim_amount;
    }

    await query(`
      UPDATE claims
      SET status = $1, approved_amount = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3;
    `, [newStatus, appAmt, id]);

    // Add History Entry
    await query(`
      INSERT INTO claim_status_history (claim_id, previous_status, new_status, changed_by, comments)
      VALUES ($1, $2, $3, $4, $5);
    `, [id, currentStatus, newStatus, req.user?.id, comments || `Status changed to ${newStatus}`]);

    // Audit Log
    await query(`
      INSERT INTO audit_logs (user_id, action, resource, resource_id, old_value, new_value)
      VALUES ($1, 'UPDATE_CLAIM_STATUS', 'Claim', $2, $3::jsonb, $4::jsonb);
    `, [req.user?.id, id, JSON.stringify({ status: currentStatus }), JSON.stringify({ status: newStatus, comments })]);

    return res.json({
      success: true,
      message: `Claim status updated to ${newStatus} successfully`,
      data: { status: newStatus }
    });
  } catch (err) {
    console.error('Update claim status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update claim status' });
  }
});

export default router;
