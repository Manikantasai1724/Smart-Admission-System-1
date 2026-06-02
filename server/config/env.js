/**
 * @fileoverview Centralized environment configuration.
 * Loads variables from .env and exports a frozen config object so that
 * every module references a single source of truth.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Resolve .env relative to this file's parent directory (server/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

/**
 * Application configuration derived from environment variables.
 * @typedef {Object} AppConfig
 * @property {number}  PORT        - HTTP port the server listens on.
 * @property {string}  MONGODB_URI - MongoDB connection string.
 * @property {string}  JWT_SECRET  - Secret key for signing JWTs.
 * @property {string}  JWT_EXPIRY  - JWT token lifetime (e.g. '24h').
 * @property {string}  NODE_ENV    - Runtime environment name.
 */
const config = Object.freeze({
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-admission',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production-abc123xyz',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',
  NODE_ENV: process.env.NODE_ENV || 'development',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
});

export default config;
