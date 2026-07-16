/**
 * Global Error Handler Middleware
 * Catches and formats all errors for consistent API responses
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../application/errors/AppError';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  // Handle known AppErrors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      code: err.code,
      details: err.details,
      timestamp: err.timestamp.toISOString()
    });
    return;
  }

  // Handle generic JavaScript errors
  const statusCode = 500;
  const errorCode = 'INTERNAL_SERVER_ERROR';
  
  res.status(statusCode).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    code: errorCode,
    timestamp: new Date().toISOString()
  });
}

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString()
  });
}
