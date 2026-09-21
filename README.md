# Policia — Policy & Claims Management Platform

Production-quality full-stack Policy & Claims Management Platform featuring multi-role RBAC (Admin, Agent, Customer), automated policy versioning, claim state machine workflow, mock payment gateway with webhooks, and a hybrid Tool Calling + RAG AI Assistant powered by Google Gemini with strict resource authorization.

Designed with a warm cream/coral visual theme inspired by modern SaaS analytics dashboards.

---

## 🌟 Key Features

### 1. Multi-Role RBAC System
- **ADMIN**: Policy CRUD & versioning, agent management & customer assignment, global analytics, audit logs.
- **AGENT**: Assigned customer profiles, claims queue, interactive claim state machine transition workspace.
- **CUSTOMER**: Dashboard overview, active policy coverage breakdown, multi-step claim submission with document upload, installment plans & mock payment gateway.

### 2. Prominent 3-Click Demo Logins
The `/login` screen features prominent 1-click buttons:
- `Admin Demo` (`admin.demo@example.com` / `DemoAdmin@123`)
- `Agent Demo` (`agent.demo@example.com` / `DemoAgent@123`)
- `Customer Demo` (`customer.demo@example.com` / `DemoCustomer@123`)

### 3. Native PostgreSQL + pgvector Engine
- High-performance `pg` pool connection handling DDL schema and indexed parameterized SQL queries.
- Native `pgvector` text embedding storage and cosine distance similarity search (`ORDER BY embedding <=> $1`).

### 4. Hybrid Gemini AI Assistant (`/customer/assistant`)
- **Structured Tool Calling**: `getCustomerPolicies()`, `getPolicyDetails()`, `getUpcomingPayments()`, `getCustomerClaims()`, `getClaimStatus()`.
- **Authorized Vector RAG**: Searches policy text chunks strictly filtered by `policy_id IN (customer_active_policies)`.
- **Citations**: Returns policy document source, section name, and page number.
- **Demo Guardrails & Fallback**: AI cannot approve claims or alter payments; includes automated offline demo mode.

---

## 🏗 Stack Overview

```text
Frontend:  Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts
Backend:   Node.js, Express.js, TypeScript, Native pg Driver (node-postgres)
Database:  PostgreSQL with pgvector extension
AI Engine: Google Gemini API (LLM + Embeddings + Function Calling + RAG)
```

---

## 🚀 Getting Started

### 1. Database Setup (Local PostgreSQL)
Ensure PostgreSQL is running locally on port `5432` with database `policy_claims_db` created (or update credentials in `.env`).

```bash
# Enable pgvector extension in PostgreSQL:
CREATE DATABASE policy_claims_db;
```

### 2. Install & Seed Database
```bash
# In backend directory:
cd backend
npm install
npm run db:init
```

### 3. Start Backend Server
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

### 4. Start Frontend Client
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:3000
```

Open `http://localhost:3000` in your browser to launch the application.

---

## 📑 API Endpoints Summary

- `POST /api/v1/auth/login` - Standard login
- `POST /api/v1/auth/demo-login` - 1-Click demo authentication
- `GET /api/v1/policies` - List policies
- `POST /api/v1/policies` - Admin create policy & version
- `GET /api/v1/claims` - Role-scoped claims queue
- `PATCH /api/v1/claims/:id/status` - Claim state machine transition
- `GET /api/v1/payments/upcoming` - Upcoming installments
- `POST /api/v1/payments/create-intent` - Payment gateway intent
- `POST /api/v1/payments/webhook` - Mock payment webhook status sync
- `POST /api/v1/ai/assistant/chat` - Hybrid Tool + RAG AI Assistant
- `GET /api/v1/audit` - Admin security audit logs
