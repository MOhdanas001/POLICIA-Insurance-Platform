import { Router, Response } from 'express';
import { query } from '../../database/db';
import { authenticateJwt, AuthRequest } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

const router = Router();

// GET all policies (Public/Authenticated)
router.get('/', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const { search, type, status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (name ILIKE $${params.length} OR policy_number ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    if (type && type !== 'ALL') {
      params.push(type);
      whereClause += ` AND policy_type = $${params.length}`;
    }

    if (status && status !== 'ALL') {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    const countRes = await query(`SELECT COUNT(*) FROM policies ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(Number(limit), offset);
    const policiesRes = await query(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM customer_policies cp WHERE cp.policy_id = p.id AND cp.status = 'ACTIVE') as active_customers_count
      FROM policies p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    return res.json({
      success: true,
      data: {
        policies: policiesRes.rows,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        }
      }
    });
  } catch (err: any) {
    console.error('Fetch policies error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch policies' });
  }
});

// GET policy detail by ID
router.get('/:id', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const polRes = await query(`SELECT * FROM policies WHERE id = $1`, [id]);

    if (polRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Policy not found', code: 'NOT_FOUND' });
    }

    const policy = polRes.rows[0];

    // Fetch versions
    const verRes = await query(`
      SELECT pv.*, u.first_name || ' ' || u.last_name as uploader_name
      FROM policy_versions pv
      LEFT JOIN users u ON pv.uploaded_by = u.id
      WHERE pv.policy_id = $1
      ORDER BY pv.created_at DESC
    `, [id]);

    // Fetch documents
    const docRes = await query(`
      SELECT pd.*, u.first_name || ' ' || u.last_name as uploader_name
      FROM policy_documents pd
      LEFT JOIN users u ON pd.uploaded_by = u.id
      WHERE pd.policy_id = $1
      ORDER BY pd.created_at DESC
    `, [id]);

    // Fetch claims count
    const claimsRes = await query(`SELECT COUNT(*) FROM claims WHERE policy_id = $1`, [id]);

    return res.json({
      success: true,
      data: {
        policy,
        versions: verRes.rows,
        documents: docRes.rows,
        metrics: {
          totalClaims: parseInt(claimsRes.rows[0].count, 10)
        }
      }
    });
  } catch (err) {
    console.error('Policy detail error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch policy details' });
  }
});

// POST Admin create policy
router.post('/', authenticateJwt, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, policyType, description, coverageAmount, annualPremium, paymentFrequency,
      durationMonths, eligibility, termsConditions, exclusions, benefits, claimRequirements
    } = req.body;

    if (!name || !policyType || !coverageAmount || !annualPremium) {
      return res.status(400).json({ success: false, message: 'Missing required policy fields', code: 'INVALID_INPUT' });
    }

    const pNum = `POL-${policyType.substring(0, 1).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const pRes = await query(`
      INSERT INTO policies (
        policy_number, name, policy_type, description, coverage_amount, annual_premium,
        payment_frequency, duration_months, eligibility, terms_conditions, exclusions,
        benefits, claim_requirements, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'ACTIVE')
      RETURNING *;
    `, [
      pNum, name, policyType, description || '', coverageAmount, annualPremium,
      paymentFrequency || 'MONTHLY', durationMonths || 12, eligibility || '',
      termsConditions || '', exclusions || '', benefits || '', claimRequirements || ''
    ]);

    const newPolicy = pRes.rows[0];

    // Auto-create version 1.0
    const verRes = await query(`
      INSERT INTO policy_versions (policy_id, version, effective_date, uploaded_by, status, document_url)
      VALUES ($1, '1.0', CURRENT_DATE, $2, 'PUBLISHED', $3)
      RETURNING *;
    `, [newPolicy.id, req.user?.id, `/documents/policies/${pNum}_v1.0.pdf`]);

    // Create Knowledge Base Text Chunks for RAG Vector Search
    const kDocRes = await query(`
      INSERT INTO knowledge_documents (policy_id, title, file_url, version)
      VALUES ($1, $2, $3, '1.0')
      RETURNING id;
    `, [newPolicy.id, `${name} Policy Wording`, `/documents/policies/${pNum}_v1.0.pdf`]);

    const kDocId = kDocRes.rows[0].id;
    const dummyVector = new Array(768).fill(0).map((_, i) => Math.sin((i + 1) * 3));
    const vectorStr = `[${dummyVector.join(',')}]`;

    await query(`
      INSERT INTO knowledge_chunks (document_id, policy_id, version, section, page_number, content, embedding)
      VALUES 
      ($1, $2, '1.0', 'Coverage Overview', 1, $3, $5::vector),
      ($1, $2, '1.0', 'Terms & Exclusions', 3, $4, $5::vector);
    `, [kDocId, newPolicy.id, `Coverage amount ₹${coverageAmount}. Benefits: ${benefits}`, `Terms: ${termsConditions}. Exclusions: ${exclusions}`, vectorStr]);

    // Audit log
    await query(`
      INSERT INTO audit_logs (user_id, action, resource, resource_id, new_value)
      VALUES ($1, 'CREATE_POLICY', 'Policy', $2, $3::jsonb);
    `, [req.user?.id, newPolicy.id, JSON.stringify(newPolicy)]);

    return res.status(201).json({
      success: true,
      message: 'Policy created successfully',
      data: { policy: newPolicy, version: verRes.rows[0] }
    });
  } catch (err: any) {
    console.error('Create policy error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create policy' });
  }
});

// POST Admin Create Policy Version
router.post('/:id/versions', authenticateJwt, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { version, effectiveDate, documentUrl } = req.body;

    const verRes = await query(`
      INSERT INTO policy_versions (policy_id, version, effective_date, uploaded_by, status, document_url)
      VALUES ($1, $2, $3, $4, 'PUBLISHED', $5)
      RETURNING *;
    `, [id, version || '1.1', effectiveDate || new Date().toISOString().split('T')[0], req.user?.id, documentUrl || '/documents/sample.pdf']);

    await query(`
      INSERT INTO audit_logs (user_id, action, resource, resource_id, new_value)
      VALUES ($1, 'CREATE_POLICY_VERSION', 'PolicyVersion', $2, $3::jsonb);
    `, [req.user?.id, verRes.rows[0].id, JSON.stringify(verRes.rows[0])]);

    return res.status(201).json({
      success: true,
      message: 'Policy version published successfully',
      data: { version: verRes.rows[0] }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create policy version' });
  }
});

export default router;
