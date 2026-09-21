import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_policy_claims_2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_jwt_refresh_key_policy_claims_2026',
  jwtExpiresIn: '1d',
  jwtRefreshExpiresIn: '7d',

  db: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:23%23A%23khan@localhost:5432/policy_claims_db',
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '23#A#khan',
    database: process.env.PGDATABASE || 'policy_claims_db',
  },

  geminiApiKey: process.env.GEMINI_API_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
