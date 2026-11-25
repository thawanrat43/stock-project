
import dotenv from 'dotenv';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const envPath = path.resolve(currentDir, '../../.env');

const envResult = dotenv.config({
  path: envPath,
  override: true,
});

if (envResult.error) {
  throw new Error('Cannot load .env file');
}

const password = process.env.DB_PASSWORD;

if (typeof password !== 'string' || password.length === 0) {
  throw new Error('DB_PASSWORD is missing or empty');
}

console.log('Database configuration:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  passwordLoaded: true,
  passwordLength: password.length,
});

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'drr_stock',
  user: process.env.DB_USER || 'postgres',
  password,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (error) => {
  console.error('PostgreSQL pool error:', error.message);
});

export default pool;
