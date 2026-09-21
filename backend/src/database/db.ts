import { Pool, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';

export const pool = new Pool({
  connectionString: config.db.connectionString,
  // If connection string fails, fallback to discrete params
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv === 'development') {
      // console.log('executed query', { text: text.substring(0, 80), duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', { text, params, error });
    throw error;
  }
};

export const initDatabase = async (): Promise<boolean> => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.warn('schema.sql not found at', schemaPath);
      return false;
    }
    const sql = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(sql);
    console.log('PostgreSQL Database schema initialized successfully with pgvector support.');
    return true;
  } catch (err: any) {
    console.warn('PostgreSQL connection notice / initialization warning:', err.message);
    console.warn('Please ensure PostgreSQL is running locally with database policy_claims_db created.');
    return false;
  }
};
