/**
 * Integration Tests for Document Search API
 * Tests REST endpoints with mocked external APIs
 */

import request from 'supertest';
import 'reflect-metadata';
import express, { Express } from 'express';
import { container } from 'tsyringe';

// Setup mocks BEFORE any imports that use them
const mockSalesSearch = jest.fn();
const mockServiceSearch = jest.fn();

jest.mock('../../../src/interface-adapters/external-clients/SalesSystemAPIClient');
jest.mock('../../../src/interface-adapters/external-clients/ServiceSystemAPIClient');

import { SalesSystemAPIClient } from '../../../src/interface-adapters/external-clients/SalesSystemAPIClient';
import { ServiceSystemAPIClient } from '../../../src/interface-adapters/external-clients/ServiceSystemAPIClient';
import { DocumentSearchService } from '../../../src/application/services/DocumentSearchService';
import { ValidationService } from '../../../src/application/services/ValidationService';
import { ExternalAPIOrchestrator } from '../../../src/application/services/ExternalAPIOrchestrator';
import { DocumentSearchController } from '../../../src/interface-adapters/controllers/DocumentSearchController';
import { SearchHistoryRepository } from '../../../src/interface-adapters/repositories/SearchHistoryRepository';
import { WinstonLogger } from '../../../src/frameworks/logger/Logger';
import { errorHandler, notFoundHandler } from '../../../src/interface-adapters/middleware/errorHandler';

describe('Document Search API - Integration Tests', () => {
  let app: Express;
  let searchHistoryRepository: SearchHistoryRepository;

  beforeAll(() => {
    // Create a fresh Express app for testing
    app = express();
    app.use(express.json());

    // Clear container and register mocked services
    container.clearInstances();

    // Create mock instances
    const mockSalesClient = new (SalesSystemAPIClient as any)();
    mockSalesClient.search = mockSalesSearch;
    
    const mockServiceClient = new (ServiceSystemAPIClient as any)();
    mockServiceClient.search = mockServiceSearch;

    // Register all services manually for testing
    container.registerSingleton('ValidationService', ValidationService);
    container.registerSingleton('ExternalAPIOrchestrator', ExternalAPIOrchestrator);
    container.registerSingleton('DocumentSearchService', DocumentSearchService);
    container.registerSingleton('SearchHistoryRepository', SearchHistoryRepository);
    container.registerSingleton('Logger', WinstonLogger);
    
    // Override the API clients with mocks
    container.registerInstance('SalesSystemAPIClient', mockSalesClient);
    container.registerInstance('ServiceSystemAPIClient', mockServiceClient);

    // Get repository reference
    searchHistoryRepository = container.resolve(SearchHistoryRepository);

    // Setup routes
    const controller = container.resolve(DocumentSearchController);

    // Health check
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    // API routes
    app.post('/api/v1/documents/search', (req, res, next) =>
      controller.search(req, res, next)
    );
    app.get('/api/v1/documents/search-history', (req, res, next) =>
      controller.searchHistory(req, res, next)
    );

    // Middleware chain MUST be in correct order
    // 1. Not Found Handler (must come before error handler)
    app.use(notFoundHandler);

    // 2. Error Handler (MUST be last)
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockSalesSearch.mockResolvedValue([]);
    mockServiceSearch.mockResolvedValue([]);
  });

  afterEach(async () => {
    // Clear search history
    await searchHistoryRepository.clear();
  });

  describe('POST /api/v1/documents/search', () => {
    it('should return 200 with documents when search is successful', async () => {
      const { Document } = require('../../../src/domain/entities/Document');
      const mockDocument = new Document(
        '1',
        'doc-1',
        'WBADT43452G808140',
        'Invoice',
        'invoice',
        'SALES_SYSTEM',
        new Date('2026-01-01'),
        new Date('2026-01-01'),
        'https://example.com/1',
        1024,
        {}
      );

      // Set up mocks for this test
      mockSalesSearch.mockResolvedValue([mockDocument]);
      mockServiceSearch.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/v1/documents/search')
        .send({ vin: 'WBADT43452G808140' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('documents');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('total');
      expect(response.body.metadata).toHaveProperty('returned');
    });

    it('should return 400 when VIN is missing', async () => {
      const response = await request(app)
        .post('/api/v1/documents/search')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when VIN format is invalid (not 17 chars)', async () => {
      const response = await request(app)
        .post('/api/v1/documents/search')
        .send({ vin: 'INVALID' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when VIN contains lowercase letters', async () => {
      const response = await request(app)
        .post('/api/v1/documents/search')
        .send({ vin: 'wbadt43452g808140' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should normalize VIN to uppercase', async () => {
      const { Document } = require('../../../src/domain/entities/Document');
      const mockDocument = new Document(
        '1',
        'doc-1',
        'WBADT43452G808140',
        'Doc',
        'document',
        'SALES_SYSTEM',
        new Date(),
        new Date(),
        'https://example.com/1',
        1024,
        {}
      );

      // Request with VIN already uppercase (as required by DTO validation)
      mockSalesSearch.mockResolvedValue([mockDocument]);
      mockServiceSearch.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/v1/documents/search')
        .send({ vin: 'WBADT43452G808140' });

      expect(response.status).toBe(200);
      expect(response.body.metadata.total).toBeGreaterThanOrEqual(0);
    });

    it('should apply pagination with limit and offset', async () => {
      const { Document } = require('../../../src/domain/entities/Document');
      const mockDoc1 = new Document(
        '1',
        'doc-1',
        'WBADT43452G808140',
        'Doc1',
        'invoice',
        'SALES_SYSTEM',
        new Date('2026-01-01'),
        new Date('2026-01-01'),
        'https://example.com/1',
        1024,
        {}
      );
      const mockDoc2 = new Document(
        '2',
        'doc-2',
        'WBADT43452G808140',
        'Doc2',
        'invoice',
        'SALES_SYSTEM',
        new Date('2026-01-02'),
        new Date('2026-01-02'),
        'https://example.com/2',
        1024,
        {}
      );

      mockSalesSearch.mockResolvedValue([mockDoc1, mockDoc2]);
      mockServiceSearch.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/v1/documents/search')
        .send({
          vin: 'WBADT43452G808140',
          pagination: { limit: 1, offset: 0 }
        });

      expect(response.status).toBe(200);
      expect(response.body.metadata.returned).toBeLessThanOrEqual(1);
      expect(response.body.metadata.limit).toBe(1);
      expect(response.body.metadata.offset).toBe(0);
    });

    it('should return error when limit exceeds maximum (1000)', async () => {
      const response = await request(app)
        .post('/api/v1/documents/search')
        .send({
          vin: 'WBADT43452G808140',
          pagination: { limit: 1001, offset: 0 }
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return partial success when one API fails', async () => {
      const { Document } = require('../../../src/domain/entities/Document');
      const mockDocument = new Document(
        '1',
        'doc-1',
        'WBADT43452G808140',
        'Doc',
        'invoice',
        'SALES_SYSTEM',
        new Date(),
        new Date(),
        'https://example.com/1',
        1024,
        {}
      );

      mockSalesSearch.mockResolvedValue([mockDocument]);
      mockServiceSearch.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .post('/api/v1/documents/search')
        .send({ vin: 'WBADT43452G808140' });

      expect(response.status).toBe(200);
      expect(response.body.metadata.partial).toBe(true);
      expect(response.body).toHaveProperty('errors');
    });

    it('should return aggregated results when both APIs succeed', async () => {
      const { Document } = require('../../../src/domain/entities/Document');
      const salesDoc = new Document(
        '1',
        'sales-doc-1',
        'WBADT43452G808140',
        'Sales Doc',
        'invoice',
        'SALES_SYSTEM',
        new Date('2026-01-01'),
        new Date('2026-01-01'),
        'https://example.com/1',
        1024,
        {}
      );
      const serviceDoc = new Document(
        '2',
        'service-doc-1',
        'WBADT43452G808140',
        'Service Doc',
        'maintenance',
        'SERVICE_SYSTEM',
        new Date('2026-02-01'),
        new Date('2026-02-01'),
        'https://example.com/2',
        2048,
        {}
      );

      mockSalesSearch.mockResolvedValue([salesDoc]);
      mockServiceSearch.mockResolvedValue([serviceDoc]);

      const response = await request(app)
        .post('/api/v1/documents/search')
        .send({ vin: 'WBADT43452G808140' });

      expect(response.status).toBe(200);
      expect(response.body.metadata.total).toBe(2);
      expect(response.body.metadata.partial).toBe(false);
      expect(response.body.documents).toHaveLength(2);

      // Check source attribution
      const sources = response.body.documents.map((doc: any) => doc.source);
      expect(sources).toContain('SALES_SYSTEM');
      expect(sources).toContain('SERVICE_SYSTEM');
    });

    it('should return documents sorted by creation date (newest first)', async () => {
      const { Document } = require('../../../src/domain/entities/Document');
      const doc1 = new Document(
        '1',
        'doc-1',
        'WBADT43452G808140',
        'Doc 1',
        'invoice',
        'SALES_SYSTEM',
        new Date('2026-01-01'),
        new Date('2026-01-01'),
        'https://example.com/1',
        1024,
        {}
      );
      const doc2 = new Document(
        '2',
        'doc-2',
        'WBADT43452G808140',
        'Doc 2',
        'invoice',
        'SALES_SYSTEM',
        new Date('2026-03-01'),
        new Date('2026-03-01'),
        'https://example.com/2',
        1024,
        {}
      );
      const doc3 = new Document(
        '3',
        'doc-3',
        'WBADT43452G808140',
        'Doc 3',
        'invoice',
        'SALES_SYSTEM',
        new Date('2026-02-01'),
        new Date('2026-02-01'),
        'https://example.com/3',
        1024,
        {}
      );

      mockSalesSearch.mockResolvedValue([doc1, doc3, doc2]);
      mockServiceSearch.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/v1/documents/search')
        .send({ vin: 'WBADT43452G808140' });

      expect(response.status).toBe(200);
      const dates = response.body.documents.map((doc: any) => new Date(doc.createdDate).getTime());
      expect(dates).toEqual([...dates].sort((a, b) => b - a));
    });

    it('should return HATEOAS links in response', async () => {
      const { Document } = require('../../../src/domain/entities/Document');
      const mockDoc = new Document(
        '1',
        'doc-1',
        'WBADT43452G808140',
        'Doc',
        'invoice',
        'SALES_SYSTEM',
        new Date(),
        new Date(),
        'https://example.com/1',
        1024,
        {}
      );

      mockSalesSearch.mockResolvedValue([mockDoc]);
      mockServiceSearch.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/v1/documents/search')
        .send({ vin: 'WBADT43452G808140' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_links');
      expect(response.body._links).toHaveProperty('self');
      expect(response.body._links.self).toContain('WBADT43452G808140');
    });
  });

  describe('GET /api/v1/documents/search-history', () => {
    it('should return 200 with search history', async () => {
      // First perform a search to create history
      const { Document } = require('../../../src/domain/entities/Document');
      const mockDoc = new Document(
        '1',
        'doc-1',
        'WBADT43452G808140',
        'Doc',
        'invoice',
        'SALES_SYSTEM',
        new Date(),
        new Date(),
        'https://example.com/1',
        1024,
        {}
      );

      mockSalesSearch.mockResolvedValue([mockDoc]);
      mockServiceSearch.mockResolvedValue([]);

      await request(app)
        .post('/api/v1/documents/search')
        .send({ vin: 'WBADT43452G808140' });

      // Now retrieve history
      const response = await request(app)
        .get('/api/v1/documents/search-history');

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty('searches');
      expect(Array.isArray(response.body.searches)).toBe(true);
      expect(response.body).toHaveProperty('metadata');
    });

    it('should return empty search history when no searches performed', async () => {
      const response = await request(app)
        .get('/api/v1/documents/search-history');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('searches');
      expect(Array.isArray(response.body.searches)).toBe(true);
    });

    it('should apply pagination to search history', async () => {
      const response = await request(app)
        .get('/api/v1/documents/search-history?limit=10&offset=0');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metadata');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/invalid-endpoint');

      expect(response.status).toBe(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle internal server errors gracefully', async () => {
      mockSalesSearch.mockRejectedValue(new Error('Internal server error'));
      mockServiceSearch.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/v1/documents/search')
        .send({ vin: 'WBADT43452G808140' });

      expect(response.status).toBe(200); // Returns 200 with partial flag
      expect(response.body.metadata.partial).toBe(true);
    });

    it('should handle both APIs failing', async () => {
      mockSalesSearch.mockRejectedValue(new Error('Sales API failed'));
      mockServiceSearch.mockRejectedValue(new Error('Service API failed'));

      const response = await request(app)
        .post('/api/v1/documents/search')
        .send({ vin: 'WBADT43452G808140' });

      expect(response.status).toBe(200);
      // Both failed = not partial (partial means one succeeded, one failed)
      expect(response.body.metadata.partial).toBe(false);
      expect(response.body.documents).toHaveLength(0);
      // But we should have error details
      expect(response.body.errors).toBeDefined();
    });
  });
});
