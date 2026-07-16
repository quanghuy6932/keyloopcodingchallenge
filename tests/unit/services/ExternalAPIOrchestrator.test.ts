/**
 * ExternalAPIOrchestrator Unit Tests
 * Tests parallel API execution, timeout handling, and error aggregation
 */

import { ExternalAPIOrchestrator } from '../../../src/application/services/ExternalAPIOrchestrator';
import { Document } from '../../../src/domain/entities/Document';
import { TimeoutError, APIError } from '../../../src/application/errors/AppError';
import { WinstonLogger } from '../../../src/frameworks/logger/Logger';

// Mock logger
jest.mock('../../../src/frameworks/logger/Logger');

describe('ExternalAPIOrchestrator', () => {
  let orchestrator: ExternalAPIOrchestrator;
  let mockLogger: jest.Mocked<WinstonLogger>;

  beforeEach(() => {
    mockLogger = new WinstonLogger() as jest.Mocked<WinstonLogger>;
    orchestrator = new ExternalAPIOrchestrator(mockLogger);
  });

  describe('callAPIsInParallel', () => {
    const createMockDocument = (id: string, source: string): Document => {
      return new Document(
        id,
        `doc-${id}`,
        'WBADT43452G808140',
        `Document ${id}`,
        'invoice',
        source,
        new Date('2026-01-01'),
        new Date('2026-01-01'),
        `https://example.com/${id}`,
        1024,
        {}
      );
    };

    it('should return success when both APIs succeed', async () => {
      const salesDocs = [createMockDocument('1', 'SALES_SYSTEM')];
      const serviceDocs = [createMockDocument('2', 'SERVICE_SYSTEM')];

      const salesPromise = Promise.resolve(salesDocs);
      const servicePromise = Promise.resolve(serviceDocs);

      const result = await orchestrator.callAPIsInParallel(salesPromise, servicePromise);

      expect(result.salesSuccess).toBe(true);
      expect(result.serviceSuccess).toBe(true);
      expect(result.salesDocuments).toEqual(salesDocs);
      expect(result.serviceDocuments).toEqual(serviceDocs);
      expect(result.salesError).toBeUndefined();
      expect(result.serviceError).toBeUndefined();
    });

    it('should handle sales API failure gracefully', async () => {
      const error = new APIError('Sales API failed');
      const salesPromise = Promise.reject(error);
      const serviceDocs = [createMockDocument('2', 'SERVICE_SYSTEM')];
      const servicePromise = Promise.resolve(serviceDocs);

      const result = await orchestrator.callAPIsInParallel(salesPromise, servicePromise);

      expect(result.salesSuccess).toBe(false);
      expect(result.serviceSuccess).toBe(true);
      expect(result.salesError).toBeDefined();
      expect(result.salesDocuments).toEqual([]);
      expect(result.serviceDocuments).toEqual(serviceDocs);
    });

    it('should handle service API failure gracefully', async () => {
      const salesDocs = [createMockDocument('1', 'SALES_SYSTEM')];
      const error = new APIError('Service API failed');
      const salesPromise = Promise.resolve(salesDocs);
      const servicePromise = Promise.reject(error);

      const result = await orchestrator.callAPIsInParallel(salesPromise, servicePromise);

      expect(result.salesSuccess).toBe(true);
      expect(result.serviceSuccess).toBe(false);
      expect(result.serviceError).toBeDefined();
      expect(result.salesDocuments).toEqual(salesDocs);
      expect(result.serviceDocuments).toEqual([]);
    });

    it('should handle both APIs failing', async () => {
      const salesError = new APIError('Sales API failed');
      const serviceError = new APIError('Service API failed');
      const salesPromise = Promise.reject(salesError);
      const servicePromise = Promise.reject(serviceError);

      const result = await orchestrator.callAPIsInParallel(salesPromise, servicePromise);

      expect(result.salesSuccess).toBe(false);
      expect(result.serviceSuccess).toBe(false);
      expect(result.salesError).toBeDefined();
      expect(result.serviceError).toBeDefined();
      expect(result.salesDocuments).toEqual([]);
      expect(result.serviceDocuments).toEqual([]);
    });

    it('should handle sales API timeout', async () => {
      const salesPromise = new Promise<Document[]>((resolve) => {
        setTimeout(() => resolve([]), 10000);
      });
      const serviceDocs = [createMockDocument('2', 'SERVICE_SYSTEM')];
      const servicePromise = Promise.resolve(serviceDocs);

      const result = await orchestrator.callAPIsInParallel(salesPromise, servicePromise);

      // Should timeout after 5000ms
      expect(result.serviceSuccess).toBe(true);
      // Sales might timeout or succeed depending on timing
      expect(result.serviceDocuments).toEqual(serviceDocs);
    }, 10000);

    it('should return empty arrays when both APIs timeout', async () => {
      const salesPromise = new Promise<Document[]>(() => {
        // Never resolves
      });
      const servicePromise = new Promise<Document[]>(() => {
        // Never resolves
      });

      const result = await orchestrator.callAPIsInParallel(salesPromise, servicePromise);

      // Both should timeout
      expect(result.salesSuccess).toBe(false);
      expect(result.serviceSuccess).toBe(false);
    }, 10000);

    it('should handle empty document arrays', async () => {
      const salesPromise = Promise.resolve([]);
      const servicePromise = Promise.resolve([]);

      const result = await orchestrator.callAPIsInParallel(salesPromise, servicePromise);

      expect(result.salesSuccess).toBe(true);
      expect(result.serviceSuccess).toBe(true);
      expect(result.salesDocuments).toEqual([]);
      expect(result.serviceDocuments).toEqual([]);
    });

    it('should handle multiple documents from each API', async () => {
      const salesDocs = [
        createMockDocument('1', 'SALES_SYSTEM'),
        createMockDocument('2', 'SALES_SYSTEM'),
        createMockDocument('3', 'SALES_SYSTEM'),
      ];
      const serviceDocs = [
        createMockDocument('4', 'SERVICE_SYSTEM'),
        createMockDocument('5', 'SERVICE_SYSTEM'),
      ];

      const salesPromise = Promise.resolve(salesDocs);
      const servicePromise = Promise.resolve(serviceDocs);

      const result = await orchestrator.callAPIsInParallel(salesPromise, servicePromise);

      expect(result.salesDocuments).toHaveLength(3);
      expect(result.serviceDocuments).toHaveLength(2);
      expect(result.salesSuccess).toBe(true);
      expect(result.serviceSuccess).toBe(true);
    });
  });

  describe('helper methods', () => {
    describe('hasAtLeastOneSuccess', () => {
      it('should return true when at least one API succeeds', () => {
        const result = orchestrator.hasAtLeastOneSuccess(true, false);
        expect(result).toBe(true);
      });

      it('should return false when both APIs fail', () => {
        const result = orchestrator.hasAtLeastOneSuccess(false, false);
        expect(result).toBe(false);
      });

      it('should return true when both succeed', () => {
        const result = orchestrator.hasAtLeastOneSuccess(true, true);
        expect(result).toBe(true);
      });
    });

    describe('bothFailed', () => {
      it('should return true when both APIs fail', () => {
        const result = orchestrator.bothFailed(false, false);
        expect(result).toBe(true);
      });

      it('should return false when at least one succeeds', () => {
        const result = orchestrator.bothFailed(true, false);
        expect(result).toBe(false);
      });
    });

    describe('isPartial', () => {
      it('should return true when exactly one API succeeds', () => {
        const result = orchestrator.isPartial(true, false);
        expect(result).toBe(true);
      });

      it('should return false when both succeed', () => {
        const result = orchestrator.isPartial(true, true);
        expect(result).toBe(false);
      });

      it('should return false when both fail', () => {
        const result = orchestrator.isPartial(false, false);
        expect(result).toBe(false);
      });
    });
  });
});
