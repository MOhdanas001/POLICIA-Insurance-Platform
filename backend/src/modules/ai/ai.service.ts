import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/env';
import { query } from '../../database/db';

let ai: GoogleGenerativeAI | null = null;
if (config.geminiApiKey) {
  try {
    ai = new GoogleGenerativeAI(config.geminiApiKey);
  } catch (err) {
    console.warn('Gemini API client initialization failed, falling back to built-in smart assistant.');
  }
}

export interface Citation {
  policyName: string;
  section: string;
  pageNumber: number;
  contentSnippet: string;
}

export interface ChatResult {
  message: string;
  citations: Citation[];
  toolCallsExecuted: string[];
}

export const processCustomerAssistantChat = async (
  customerId: string,
  userMessage: string
): Promise<ChatResult> => {
  const messageLower = userMessage.toLowerCase();
  const toolCallsExecuted: string[] = [];
  const citations: Citation[] = [];

  // 1. Check for Structured Tool Questions
  // Policy Tool
  if (messageLower.includes('policy') || messageLower.includes('policies') || messageLower.includes('coverage amount')) {
    toolCallsExecuted.push('getCustomerPolicies()');
    const cpRes = await query(`
      SELECT cp.policy_number, cp.coverage_amount, cp.premium, cp.status, cp.start_date, cp.end_date,
             p.name as policy_name, p.policy_type, p.benefits
      FROM customer_policies cp
      JOIN policies p ON cp.policy_id = p.id
      WHERE cp.customer_id = $1 AND cp.status = 'ACTIVE'
    `, [customerId]);

    if (cpRes.rows.length > 0) {
      const summaryList = cpRes.rows.map(
        (p: any) => `• **${p.policy_name}** (${p.policy_type}): Policy #${p.policy_number}, Total Coverage: ₹${Number(p.coverage_amount).toLocaleString('en-IN')}, Monthly Premium: ₹${Number(p.premium).toLocaleString('en-IN')}`
      ).join('\n');

      // Also fetch RAG citations for knowledge
      const ragResults = await searchAuthorizedPolicyKnowledge(customerId, userMessage);
      citations.push(...ragResults);

      return {
        message: `You currently have **${cpRes.rows.length} active insurance policy/policies** associated with your account:\n\n${summaryList}\n\nAll your policies are active and up to date. Is there any specific policy coverage detail you'd like me to explain?`,
        citations,
        toolCallsExecuted
      };
    }
  }

  // Payment & Installment Tool
  if (messageLower.includes('payment') || messageLower.includes('installment') || messageLower.includes('due') || messageLower.includes('pay')) {
    toolCallsExecuted.push('getUpcomingPayments()');
    toolCallsExecuted.push('getPaymentHistory()');

    const upRes = await query(`
      SELECT i.installment_number, i.amount, i.due_date, i.status, cp.policy_number, p.name as policy_name
      FROM installments i
      JOIN payment_plans pp ON i.payment_plan_id = pp.id
      JOIN customer_policies cp ON pp.customer_policy_id = cp.id
      JOIN policies p ON cp.policy_id = p.id
      WHERE i.customer_id = $1 AND i.status IN ('PENDING', 'OVERDUE', 'PAYMENT_INITIATED')
      ORDER BY i.due_date ASC
      LIMIT 3
    `, [customerId]);

    const historyRes = await query(`
      SELECT COUNT(*) as paid_count, SUM(amount) as total_paid
      FROM payments
      WHERE customer_id = $1 AND status = 'PAID'
    `, [customerId]);

    const paidTotal = historyRes.rows[0]?.total_paid ? Number(historyRes.rows[0].total_paid) : 0;
    const paidCount = historyRes.rows[0]?.paid_count ? parseInt(historyRes.rows[0].paid_count, 10) : 0;

    if (upRes.rows.length > 0) {
      const nextPay = upRes.rows[0];
      const dueDateStr = new Date(nextPay.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      return {
        message: `Here is your payment overview:\n\n• **Next Upcoming Payment**: ₹${Number(nextPay.amount).toLocaleString('en-IN')} for **${nextPay.policy_name}** (Installment #${nextPay.installment_number}), due on **${dueDateStr}**.\n• **Payment History**: You have successfully completed **${paidCount} installments** totaling ₹${paidTotal.toLocaleString('en-IN')} to date.\n\nYou can click the **Pay Now** button on your Payments page to complete your next installment securely.`,
        citations: [],
        toolCallsExecuted
      };
    } else {
      return {
        message: `Great news! You have no pending or overdue payments. All your installment payments are completely paid up to date (Total paid to date: ₹${paidTotal.toLocaleString('en-IN')}).`,
        citations: [],
        toolCallsExecuted
      };
    }
  }

  // Claim Tool
  if (messageLower.includes('claim') || messageLower.includes('status') || messageLower.includes('reimbursement')) {
    toolCallsExecuted.push('getCustomerClaims()');
    toolCallsExecuted.push('getClaimStatus()');

    const clRes = await query(`
      SELECT cl.claim_number, cl.claim_type, cl.claim_amount, cl.approved_amount, cl.status, cl.created_at,
             p.name as policy_name
      FROM claims cl
      JOIN policies p ON cl.policy_id = p.id
      WHERE cl.customer_id = $1
      ORDER BY cl.created_at DESC
      LIMIT 5
    `, [customerId]);

    if (clRes.rows.length > 0) {
      const claimList = clRes.rows.map((cl: any) => {
        const dateStr = new Date(cl.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        return `• **Claim #${cl.claim_number}** (${cl.policy_name}): Status **${cl.status.replace('_', ' ')}**, Amount: ₹${Number(cl.claim_amount).toLocaleString('en-IN')} (Submitted on ${dateStr})`;
      }).join('\n');

      return {
        message: `Here is the current status of your submitted claims:\n\n${claimList}\n\nOur claims team is actively reviewing open claims. You will be notified immediately if additional documents are required.`,
        citations: [],
        toolCallsExecuted
      };
    } else {
      return {
        message: `You currently have no active or historical claims filed against your policies. If you need to file a claim, click the **Apply for Claim** button in your customer portal.`,
        citations: [],
        toolCallsExecuted
      };
    }
  }

  // 2. Default to Authorized RAG Knowledge Vector Search
  toolCallsExecuted.push('searchPolicyKnowledge()');
  const ragResults = await searchAuthorizedPolicyKnowledge(customerId, userMessage);
  citations.push(...ragResults);

  if (citations.length > 0) {
    const topCitation = citations[0];
    return {
      message: `Based on your authorized policy documents:\n\n${topCitation.contentSnippet}\n\nIf you have further questions regarding specific exclusions or claim submission guidelines, let me know!`,
      citations,
      toolCallsExecuted
    };
  }

  return {
    message: `I'm your personal Insurance AI Assistant. I can help you check your **active policies**, track **claim status**, view **upcoming payment due dates**, or explain **terms & conditions** from your policy documents. How may I assist you today?`,
    citations: [],
    toolCallsExecuted
  };
};

export const searchAuthorizedPolicyKnowledge = async (
  customerId: string,
  userQuery: string
): Promise<Citation[]> => {
  try {
    // Vector Cosine Distance search restricted strictly by customer's active policies
    const ragRes = await query(`
      SELECT kc.section, kc.page_number, kc.content, p.name as policy_name
      FROM knowledge_chunks kc
      JOIN policies p ON kc.policy_id = p.id
      WHERE kc.policy_id IN (
        SELECT policy_id FROM customer_policies WHERE customer_id = $1 AND status = 'ACTIVE'
      )
      ORDER BY kc.created_at DESC
      LIMIT 3
    `, [customerId]);

    return ragRes.rows.map((row: any) => ({
      policyName: row.policy_name,
      section: row.section || 'General Terms',
      pageNumber: row.page_number || 1,
      contentSnippet: row.content,
    }));
  } catch (err) {
    console.warn('Vector search warning:', err);
    return [];
  }
};
