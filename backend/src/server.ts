import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { config } from './config/env';
import { initDatabase } from './database/db';

import authRoutes from './modules/auth/auth.routes';
import policyRoutes from './modules/policies/policy.routes';
import customerRoutes from './modules/customers/customer.routes';
import agentRoutes from './modules/agents/agent.routes';
import claimRoutes from './modules/claims/claim.routes';
import paymentRoutes from './modules/payments/payment.routes';
import aiRoutes from './modules/ai/ai.routes';
import auditRoutes from './modules/audit/audit.routes';

const app = express();

// Middleware
app.use(cors({
  origin: [config.corsOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  return res.json({ status: 'healthy', timestamp: new Date().toISOString(), env: config.nodeEnv });
});
app.get('/api/v1/health', (req: Request, res: Response) => {
  return res.json({ status: 'healthy', service: 'Policy & Claims API v1', timestamp: new Date().toISOString() });
});

// Route Bindings
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/policies', policyRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/claims', claimRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/ai/assistant', aiRoutes);
app.use('/api/v1/audit', auditRoutes);

// Centralized Error Handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled API Error:', err);
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR',
  });
});

// Boot server
const startServer = async () => {
  await initDatabase();

  app.listen(config.port, () => {
    console.log(`==================================================`);
    console.log(`🚀 Policy & Claims Platform Backend Server Running`);
    console.log(`🌐 PORT: ${config.port}`);
    console.log(`🔗 Health Check: http://localhost:${config.port}/health`);
    console.log(`==================================================`);
  });
};

startServer();

export default app;
