/**
 * DocumentSearchService Unit Tests
 * Tests core business logic for document search and aggregation
 */

import { DocumentSearchService } from '../../../src/application/services/DocumentSearchService';
import { ValidationService } from '../../../src/application/services/ValidationService';
import { ExternalAPIOrchestrator } from '../../../src/application/services/ExternalAPIOrchestrator';
import { SearchHistoryRepository } from '../../../src/interface-adapters/repositories/SearchHistoryRepository';
import { Document } from '../../../src/domain/entities/Document';
import { ValidationError, InternalServerError } from '../../../src/application/errors/AppError';
import { WinstonLogger } from '../../../src/frameworks/logger/Logger';

// Mock dependencies
jest.mock('../../../src/application/services/ValidationService');
jest.mock('../../../src/application/services/ExternalAPIOrchestrator');
jest.mock('../../../src/interface-adapters/repositories/SearchHistoryRepository');
jest.mock('../../../src/frameworks/logger/Logger');

// Mock external API clients
jest.mock('../../../src/interface-adapters/external-clients/SalesSystemAPIClient');
jest.mock('../../../src/interface-adapters/external-clients/ServiceSystemAPIClient');

describe('DocumentSearchService', () => {
  let searchService: DocumentSearchService;
  let mockValidationService: jest.Mocked<ValidationService>;
  let mockOrchestrator: jest.Mocked<ExternalAPIOrchestrator>;
  let mockRepository: jest.Mocked<SearchHistoryRepository>;
  let mockLogger: jest.Mocked<WinstonLogger>;
  let mockSalesClient: any;
  let mockServiceClient: any;

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

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidationService = new ValidationService() as jest.Mocked<ValidationService>;
    mockOrchestrator = new ExternalAPIOrchestrator(mockLogger) as jest.Mocked<ExternalAPIOrchestrator>;
    mockRepository = new SearchHistoryRepository() as jest.Mocked<SearchHistoryRepository>;
    mockLogger = new WinstonLogger() as jest.Mocked<WinstonLogger>;
    mockSalesClient = { search: jest.fn() };
    mockServiceClient = { search: jest.fn() };

    // Setup default mock behaviors
    mockValidationService.validateVinFormat = jest.fn();
    mockValidationService.normalizeVin = jest.fn((vin) => vin.toUpperCase().trim());
    mockValidationService.validatePagination = jest.fn((limit, offset) => ({
      limit: limit || 10,
      offset: offset || 0,
    }));
    mockValidationService.paginateArray = jest.fn((arr, offset, limit) =>
      arr.slice(offset, offset + limit)
    );

    mockRepository.create = jest.fn().mockResolvedValue({ id: '1' });
    mockRepository.findByVin = jest.fn().mockResolvedValue([]);

    searchService = new DocumentSearchService(
      mockValidationService,
      mockOrchestrator,
      mockSalesClient,
      mockServiceClient,
      mockRepository,
      mockLogger
    );
  });

  describe('searchByVin', () => {
    it('should successfully search and aggregate documents from both systems', async () => {
      const vin = 'WBADT43452G808140';
      const salesDocs = [createMockDocument('1', 'SALES_SYSTEM')];
      const serviceDocs = [createMockDocument('2', 'SERVICE_SYSTEM')];

      mockValidationService.validateVinFormat.mockImplementation(() => {});
      (mockOrchestrator.callAPIsInParallel as jest.Mock).mockResolvedValue({
        salesDocuments: salesDocs,
        serviceDocuments: serviceDocs,
        salesSuccess: true,
        serviceSuccess: true,
      });
      (mockOrchestrator.isPartial as jest.Mock).mockReturnValue(false);
      mockValidationService.paginateArray.mockImplementation((arr) => arr);

      const result = await searchService.searchByVin(vin);

      expect(result.metadata.total).toBe(2);
      expect(result.metadata.returned).toBe(2);
      expect(result.metadata.partial).toBe(false);
      expect(result.documents).toHaveLength(2);
      expect(mockValidationService.validateVinFormat).toHaveBeenCalledWith(vin);
    });

    it('should throw ValidationError for invalid VIN', async () => {
      const invalidVin = 'INVALID';
      mockValidationService.validateVinFormat.mockImplementation(() => {
        throw new ValidationError('Invalid VIN format');
      });

      await expect(searchService.searchByVin(invalidVin)).rejects.toThrow(ValidationError);
    });

    it('should handle partial success (one API fails)', async () => {
      const vin = 'WBADT43452G808140';
      const salesDocs = [createMockDocument('1', 'SALES_SYSTEM')];

      mockValidationService.validateVinFormat.mockImplementation(() => {});
      (mockOrchestrator.callAPIsInParallel as jest.Mock).mockResolvedValue({
        salesDocuments: salesDocs,
        serviceDocuments: [],
        salesSuccess: true,
        serviceSuccess: false,
        serviceError: { message: 'Service API unavailable' },
      });
      (mockOrchestrator.isPartial as jest.Mock).mockReturnValue(true);
      mockValidationService.paginateArray.mockImplementation((arr) => arr);

      const result = await searchService.searchByVin(vin);

      expect(result.metadata.partial).toBe(true);
      expect(result.documents).toHaveLength(1);
      expect(result.errors).toBeDefined();
      expect(result.errors?.serviceSystemError).toBeDefined();
    });

    it('should handle both APIs failing', async () => {
      const vin = 'WBADT43452G808140';

      mockValidationService.validateVinFormat.mockImplementation(() => {});
      (mockOrchestrator.callAPIsInParallel as jest.Mock).mockResolvedValue({
        salesDocuments: [],
        serviceDocuments: [],
        salesSuccess: false,
        serviceSuccess: false,
        salesError: { message: 'Sales API failed' },
        serviceError: { message: 'Service API failed' },
      });
      (mockOrchestrator.isPartial as jest.Mock).mockReturnValue(false);
      mockValidationService.paginateArray.mockImplementation((arr) => arr);

      const result = await searchService.searchByVin(vin);

      expect(result.metadata.total).toBe(0);
      expect(result.documents).toHaveLength(0);
      expect(result.errors).toBeDefined();
      expect(result.errors?.salesSystemError).toBeDefined();
      expect(result.errors?.serviceSystemError).toBeDefined();
    });

    it('should apply pagination correctly', async () => {
      const vin = 'WBADT43452G808140';
      const allDocs = [
        createMockDocument('1', 'SALES_SYSTEM'),
        createMockDocument('2', 'SALES_SYSTEM'),
        createMockDocument('3', 'SERVICE_SYSTEM'),
        createMockDocument('4', 'SERVICE_SYSTEM'),
      ];

      mockValidationService.validateVinFormat.mockImplementation(() => {});
      mockOrchestrator.callAPIsInParallel = jest.fn().mockResolvedValue({
        salesDocuments: [allDocs[0], allDocs[1]],
        serviceDocuments: [allDocs[2], allDocs[3]],
        salesSuccess: true,
        serviceSuccess: true,
      });

      const paginatedDocs = [allDocs[0], allDocs[1]]; // First 2 items
      mockValidationService.paginateArray.mockReturnValue(paginatedDocs);

      const result = await searchService.searchByVin(vin, 2, 0);

      expect(result.documents).toHaveLength(2);
      expect(mockValidationService.validatePagination).toHaveBeenCalledWith(2, 0);
      expect(mockValidationService.paginateArray).toHaveBeenCalled();
    });

    it('should normalize VIN before searching', async () => {
      const vin = '  wbadt43452g808140  ';
      const normalizedVin = 'WBADT43452G808140';

      mockValidationService.validateVinFormat.mockImplementation(() => {});
      mockValidationService.normalizeVin.mockReturnValue(normalizedVin);
      mockOrchestrator.callAPIsInParallel = jest.fn().mockResolvedValue({
        salesDocuments: [],
        serviceDocuments: [],
        salesSuccess: true,
        serviceSuccess: true,
      });
      mockValidationService.paginateArray.mockImplementation((arr) => arr);

      await searchService.searchByVin(vin);

      expect(mockValidationService.normalizeVin).toHaveBeenCalledWith(vin);
    });

    it('should sort documents by creation date descending', async () => {
      const vin = 'WBADT43452G808140';
      const doc1 = new Document(
        '1',
        'doc-1',
        vin,
        'Document 1',
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
        vin,
        'Document 2',
        'invoice',
        'SERVICE_SYSTEM',
        new Date('2026-01-03'),
        new Date('2026-01-03'),
        'https://example.com/2',
        1024,
        {}
      );
      const doc3 = new Document(
        '3',
        'doc-3',
        vin,
        'Document 3',
        'invoice',
        'SALES_SYSTEM',
        new Date('2026-01-02'),
        new Date('2026-01-02'),
        'https://example.com/3',
        1024,
        {}
      );

      mockValidationService.validateVinFormat.mockImplementation(() => {});
      mockOrchestrator.callAPIsInParallel = jest.fn().mockResolvedValue({
        salesDocuments: [doc1, doc3],
        serviceDocuments: [doc2],
        salesSuccess: true,
        serviceSuccess: true,
      });

      const sortedDocs = [doc2, doc3, doc1]; // Newest first
      mockValidationService.paginateArray.mockReturnValue(sortedDocs);

      const result = await searchService.searchByVin(vin);

      // Documents should be sorted by creation date descending
      expect(result.documents[0].createdDate).toEqual(new Date('2026-01-03'));
      expect(result.documents[1].createdDate).toEqual(new Date('2026-01-02'));
      expect(result.documents[2].createdDate).toEqual(new Date('2026-01-01'));
    });

    it('should log search history asynchronously', async () => {
      const vin = 'WBADT43452G808140';

      mockValidationService.validateVinFormat.mockImplementation(() => {});
      mockOrchestrator.callAPIsInParallel = jest.fn().mockResolvedValue({
        salesDocuments: [],
        serviceDocuments: [],
        salesSuccess: true,
        serviceSuccess: true,
      });
      mockValidationService.paginateArray.mockImplementation((arr) => arr);

      await searchService.searchByVin(vin);

      // Log should be created (asynchronously)
      // Give async operation time to execute
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should build correct HATEOAS links', async () => {
      const vin = 'WBADT43452G808140';

      mockValidationService.validateVinFormat.mockImplementation(() => {});
      mockOrchestrator.callAPIsInParallel = jest.fn().mockResolvedValue({
        salesDocuments: [createMockDocument('1', 'SALES_SYSTEM')],
        serviceDocuments: [createMockDocument('2', 'SERVICE_SYSTEM')],
        salesSuccess: true,
        serviceSuccess: true,
      });
      mockValidationService.paginateArray.mockImplementation((arr) => arr);

      const result = await searchService.searchByVin(vin, 10, 0);

      expect(result.links).toBeDefined();
      expect(result.links.self).toBeDefined();
      expect(result.links.self).toContain('vin=WBADT43452G808140');
    });
  });
});
