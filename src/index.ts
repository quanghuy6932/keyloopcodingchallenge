/**
 * Application Entry Point
 * Starts the Express server
 */

import 'reflect-metadata'; // Required for tsyringe DI
import { config } from './config/environment';
import { setupDIContainer } from './config/di-container';
import { createApp } from './frameworks/express/app';

// Setup DI container
setupDIContainer();

// Create Express app
const app = createApp();

// Start server
const PORT = config.port;
console.log('Starting server...');
const server = app.listen(PORT, () => {
  console.log('\n');
  console.log('═════════════════════════════════════════════════════');
  console.log('  Keyloop Unified Document Viewer');
  console.log('═════════════════════════════════════════════════════');
  console.log(`  Environment:       ${config.env.toUpperCase()}`);
  console.log(`  Server:            http://localhost:${PORT}`);
  console.log(`  API Docs:          http://localhost:${PORT}/api-docs`);
  console.log(`  Health Check:      http://localhost:${PORT}/health`);
  console.log('═════════════════════════════════════════════════════\n');
  console.log('✅ Server is ready and listening for requests!');
});

server.on('error', (error: Error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
