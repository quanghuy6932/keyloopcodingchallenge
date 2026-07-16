/**
 * Environment Configuration
 * Loads and validates environment variables
 */

import dotenv from 'dotenv';
import * as joi from 'joi';

// Load .env file
dotenv.config();

// Define schema for environment variables
const schema = joi.object({
  NODE_ENV: joi.string().valid('development', 'test', 'production').default('development'),
  PORT: joi.number().default(3000),
  LOG_LEVEL: joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  
  // External APIs
  SALES_API_URL: joi.string().default('http://localhost:3001'),
  SERVICE_API_URL: joi.string().default('http://localhost:3002'),
  
  // Database (for future PostgreSQL implementation)
  DATABASE_URL: joi.string().optional(),
  DB_HOST: joi.string().default('localhost'),
  DB_PORT: joi.number().default(5432),
  DB_USER: joi.string().default('postgres'),
  DB_PASSWORD: joi.string().default('postgres'),
  DB_NAME: joi.string().default('keyloop'),
  
  // Swagger/API Docs
  API_TITLE: joi.string().default('Keyloop Document Viewer'),
  API_VERSION: joi.string().default('1.0.0'),
  API_DESCRIPTION: joi.string().default('Unified Document Viewer API'),
  
  // CORS
  CORS_ORIGIN: joi.string().default('http://localhost:3000')
}).unknown();

// Validate environment variables
const { error, value: envVars } = schema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  logLevel: envVars.LOG_LEVEL,
  
  api: {
    salesUrl: envVars.SALES_API_URL,
    serviceUrl: envVars.SERVICE_API_URL
  },
  
  database: {
    url: envVars.DATABASE_URL,
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    name: envVars.DB_NAME
  },
  
  swagger: {
    title: envVars.API_TITLE,
    version: envVars.API_VERSION,
    description: envVars.API_DESCRIPTION
  },
  
  cors: {
    origin: envVars.CORS_ORIGIN
  },
  
  isProduction: envVars.NODE_ENV === 'production',
  isDevelopment: envVars.NODE_ENV === 'development',
  isTest: envVars.NODE_ENV === 'test'
};
