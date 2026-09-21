import { Pool, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';

export const pool = new Pool({
  connectionString: config.db.connectionString,

  ssl: config.nodeEnv === 'production'
    ? { rejectUnauthorized: false }
    : false,

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
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
      // console.log('executed query', {
      //   text: text.substring(0, 80),
      //   duration,
      //   rows: res.rowCount
      // });
    }

    return res;
  } catch (error) {
    console.error('Database query error:', {
      text,
      params,
      error
    });

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

    console.log(
      'PostgreSQL database schema initialized successfully.'
    );

    return true;
  } catch (err: any) {
    console.error(
      'PostgreSQL initialization failed:',
      err.message
    );

    return false;
  }
};