import { Router, Response } from 'express';
import { query } from '../../database/db';
import { authenticateJwt, AuthRequest } from '../../middleware/auth';
import { processCustomerAssistantChat } from './ai.service';

const router = Router();

// GET List conversations for customer
router.get('/conversations', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.customerId;
    if (!customerId) return res.json({ success: true, data: { conversations: [] } });

    const convRes = await query(`
      SELECT * FROM ai_conversations
      WHERE customer_id = $1
      ORDER BY updated_at DESC
    `, [customerId]);

    return res.json({ success: true, data: { conversations: convRes.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch AI conversations' });
  }
});

// GET Conversation details & messages
router.get('/conversations/:id', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const msgRes = await query(`
      SELECT * FROM ai_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `, [id]);

    return res.json({ success: true, data: { messages: msgRes.rows } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch AI conversation messages' });
  }
});

// POST Chat message
router.post('/chat', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const { message, conversationId } = req.body;
    const customerId = req.user?.customerId;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required', code: 'INVALID_INPUT' });
    }

    if (!customerId) {
      return res.status(403).json({ success: false, message: 'Only customer accounts can interact with Customer AI Assistant' });
    }

    let activeConvId = conversationId;
    if (!activeConvId) {
      const title = message.length > 40 ? `${message.substring(0, 40)}...` : message;
      const cRes = await query(`
        INSERT INTO ai_conversations (customer_id, title)
        VALUES ($1, $2)
        RETURNING id;
      `, [customerId, title]);
      activeConvId = cRes.rows[0].id;
    }

    // Record User Message
    await query(`
      INSERT INTO ai_messages (conversation_id, sender, content)
      VALUES ($1, 'user', $2);
    `, [activeConvId, message]);

    // Process Hybrid Tool + RAG Response
    const aiResult = await processCustomerAssistantChat(customerId, message);

    // Record Assistant Message
    const assistantMsgRes = await query(`
      INSERT INTO ai_messages (conversation_id, sender, content, citations, tool_calls)
      VALUES ($1, 'assistant', $2, $3::jsonb, $4::jsonb)
      RETURNING *;
    `, [
      activeConvId,
      aiResult.message,
      JSON.stringify(aiResult.citations),
      JSON.stringify(aiResult.toolCallsExecuted)
    ]);

    // Touch conversation updated_at
    await query(`UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [activeConvId]);

    return res.json({
      success: true,
      data: {
        conversationId: activeConvId,
        reply: assistantMsgRes.rows[0],
        citations: aiResult.citations,
        toolCallsExecuted: aiResult.toolCallsExecuted
      }
    });
  } catch (err: any) {
    console.error('AI chat error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process AI chat message' });
  }
});

export default router;
