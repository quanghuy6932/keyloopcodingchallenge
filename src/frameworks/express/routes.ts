/**
 * API Routes
 * Defines all API endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { DocumentSearchController } from '../../interface-adapters/controllers/DocumentSearchController';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Document search endpoints - resolve controller lazily for each request
router.post('/documents/search', (req: Request, res: Response, next: NextFunction) => {
  const documentSearchController = container.resolve(DocumentSearchController);
  return documentSearchController.search(req, res, next);
});

router.get('/documents/search-history', (req: Request, res: Response, next: NextFunction) => {
  const documentSearchController = container.resolve(DocumentSearchController);
  return documentSearchController.searchHistory(req, res, next);
});

export default router;
