import { Router, Request, Response } from 'express';
import { query } from '../../database/db';
import { authenticateJwt, AuthRequest } from '../../middleware/auth';

const router = Router();

// GET Upcoming Installments
router.get('/upcoming', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    let whereClause = "WHERE i.status IN ('PENDING', 'OVERDUE', 'PAYMENT_INITIATED')";
    const params: any[] = [];

    if (req.user?.role === 'CUSTOMER') {
      params.push(req.user.customerId);
      whereClause += ` AND i.customer_id = $${params.length}`;
    }

    const instRes = await query(`
      SELECT i.*, cp.policy_number, p.name as policy_name, p.policy_type,
        u.first_name || ' ' || u.last_name as customer_name, u.email as customer_email
      FROM installments i
      JOIN payment_plans pp ON i.payment_plan_id = pp.id
      JOIN customer_policies cp ON pp.customer_policy_id = cp.id
      JOIN policies p ON cp.policy_id = p.id
      JOIN customers c ON i.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      ${whereClause}
      ORDER BY i.due_date ASC
      LIMIT 20
    `, params);

    return res.json({ success: true, data: { upcoming: instRes.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch upcoming payments' });
  }
});

// GET Payment History
router.get('/history', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (req.user?.role === 'CUSTOMER') {
      params.push(req.user.customerId);
      whereClause += ` AND pm.customer_id = $${params.length}`;
    }

    const payRes = await query(`
      SELECT pm.*, i.installment_number, cp.policy_number, p.name as policy_name,
        u.first_name || ' ' || u.last_name as customer_name
      FROM payments pm
      JOIN installments i ON pm.installment_id = i.id
      JOIN payment_plans pp ON i.payment_plan_id = pp.id
      JOIN customer_policies cp ON pp.customer_policy_id = cp.id
      JOIN policies p ON cp.policy_id = p.id
      JOIN customers c ON pm.customer_id = c.id
      JOIN users u ON c.user_id = u.id
      ${whereClause}
      ORDER BY pm.created_at DESC
      LIMIT 50
    `, params);

    return res.json({ success: true, data: { history: payRes.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
  }
});

// POST Create Mock Payment Intent
router.post('/create-intent', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const { installmentId, paymentMethod = 'CARD' } = req.body;

    if (!installmentId) {
      return res.status(400).json({ success: false, message: 'Installment ID is required', code: 'INVALID_INPUT' });
    }

    const instRes = await query(`SELECT * FROM installments WHERE id = $1`, [installmentId]);
    if (instRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Installment not found' });

    const inst = instRes.rows[0];
    if (inst.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'Installment is already paid', code: 'ALREADY_PAID' });
    }

    // Mark status PAYMENT_INITIATED
    await query(`UPDATE installments SET status = 'PAYMENT_INITIATED' WHERE id = $1`, [installmentId]);

    const txnId = `TXN-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    return res.json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        paymentIntentId: `pi_mock_${txnId}`,
        transactionId: txnId,
        installmentId: inst.id,
        amount: inst.amount,
        currency: 'INR',
        paymentMethod
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create payment intent' });
  }
});

// POST Payment Webhook (Gateway callback to update database securely)
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { installmentId, transactionId, amount, status = 'PAID', paymentMethod = 'CARD' } = req.body;

    if (!installmentId || !transactionId) {
      return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
    }

    const instRes = await query(`SELECT * FROM installments WHERE id = $1`, [installmentId]);
    if (instRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Installment not found' });

    const inst = instRes.rows[0];

    // Mark Installment PAID
    await query(`
      UPDATE installments
      SET status = 'PAID', paid_date = CURRENT_TIMESTAMP
      WHERE id = $1;
    `, [installmentId]);

    // Record Payment
    await query(`
      INSERT INTO payments (installment_id, customer_id, amount, payment_method, transaction_id, status)
      VALUES ($1, $2, $3, $4, $5, 'PAID')
      ON CONFLICT (transaction_id) DO NOTHING;
    `, [installmentId, inst.customer_id, amount || inst.amount, paymentMethod, transactionId]);

    // Record Audit Log
    await query(`
      INSERT INTO audit_logs (user_id, action, resource, resource_id, new_value)
      VALUES ($1, 'PROCESS_PAYMENT_WEBHOOK', 'Installment', $2, $3::jsonb);
    `, [inst.customer_id, installmentId, JSON.stringify({ transactionId, status: 'PAID' })]);

    return res.json({ success: true, message: 'Payment webhook processed successfully' });
  } catch (err) {
    console.error('Payment webhook error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process payment webhook' });
  }
});

export default router;
