/**
 * Express Application Setup
 * Configures the Express app with middleware and routes
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from '../../interface-adapters/middleware/errorHandler';
import { config } from '../../config/environment';
import routes from './routes';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({
    origin: config.cors.origin,
    credentials: true
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // HTTP request logging
  app.use(morgan('combined'));

  // Root welcome endpoint
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      name: 'Keyloop Unified Document Viewer',
      version: '1.0.0',
      status: 'running',
      message: 'Welcome to Keyloop Document Viewer API',
      endpoints: {
        health: 'GET /health',
        api_docs: 'GET /api-docs',
        search: 'POST /api/v1/documents/search',
        history: 'GET /api/v1/documents/search-history'
      },
      documentation: 'http://localhost:3000/api-docs'
    });
  });

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Swagger API documentation
  const swaggerDocs = {
    openapi: '3.0.0',
    info: {
      title: config.swagger.title,
      version: config.swagger.version,
      description: config.swagger.description
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Development server'
      }
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health Check',
          description: 'Check if the server is running',
          tags: ['System'],
          responses: {
            '200': {
              description: 'Server is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'healthy' },
                      uptime: { type: 'number', example: 123.45 },
                      timestamp: { type: 'string', format: 'date-time' },
                      version: { type: 'string', example: '1.0.0' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/documents/search': {
        post: {
          summary: 'Search documents by VIN',
          description: 'Search for documents by Vehicle Identification Number across Sales and Service systems',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['vin'],
                  properties: {
                    vin: {
                      type: 'string',
                      description: 'Vehicle Identification Number (17 alphanumeric characters)',
                      example: '1HGBH41JXMN109186'
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        limit: { type: 'number', example: 100, default: 100 },
                        offset: { type: 'number', example: 0, default: 0 }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Search completed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      documents: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            documentId: { type: 'string' },
                            vin: { type: 'string' },
                            title: { type: 'string' },
                            type: { type: 'string' },
                            source: { type: 'string', enum: ['SALES_SYSTEM', 'SERVICE_SYSTEM'] },
                            createdDate: { type: 'string', format: 'date-time' },
                            modifiedDate: { type: 'string', format: 'date-time' },
                            contentUrl: { type: 'string' },
                            size: { type: 'number' }
                          }
                        }
                      },
                      metadata: {
                        type: 'object',
                        properties: {
                          total: { type: 'number' },
                          returned: { type: 'number' },
                          offset: { type: 'number' },
                          limit: { type: 'number' },
                          partial: { type: 'boolean' }
                        }
                      },
                      executionTimeMs: { type: 'number' },
                      errors: { type: 'object' },
                      _links: { type: 'object' }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Validation error'
            },
            '500': {
              description: 'Server error'
            }
          }
        }
      },
      '/documents/search-history': {
        get: {
          summary: 'Get search history',
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'number', default: 20 } },
            { name: 'offset', in: 'query', schema: { type: 'number', default: 0 } }
          ],
          responses: {
            '200': { description: 'Search history retrieved' }
          }
        }
      }
    }
  };

  // API Routes
  app.use('/api/v1', routes);

  // Redirect /api-doc (typo) to /api-docs
  app.get('/api-doc', (req: Request, res: Response) => {
    res.redirect(301, '/api-docs/');
  });

  // Swagger API documentation (must be before notFoundHandler)
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerDocs));
  app.get('/api-docs/', swaggerUi.setup(swaggerDocs));

  // 404 handler (must be before error handler)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
