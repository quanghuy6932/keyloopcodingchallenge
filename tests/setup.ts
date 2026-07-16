/**
 * Jest Setup File
 * Runs before all tests
 */

import 'reflect-metadata'; // Required for tsyringe decorators

// Suppress console output during tests
global.console.log = jest.fn();
global.console.error = jest.fn();
global.console.warn = jest.fn();
