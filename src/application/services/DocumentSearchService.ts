/**
 * DocumentSearchService
 * Core business logic for document search and aggregation
 */

import { injectable, inject } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../../domain/entities/Document';
import { SearchLog } from '../../domain/entities/SearchLog';
import { AggregatedSearchResult, Metadata, Errors, Links } from '../../domain/entities/AggregatedSearchResult';
import { ValidationService } from './ValidationService';
import { ExternalAPIOrchestrator } from './ExternalAPIOrchestrator';
import { ISalesSystemAPIClient } from '../../interface-adapters/external-clients/ISalesSystemAPIClient';
import { IServiceSystemAPIClient } from '../../interface-adapters/external-clients/IServiceSystemAPIClient';
import { SearchHistoryRepository } from '../../interface-adapters/repositories/SearchHistoryRepository';
import { Logger } from '../../frameworks/logger/Logger';
import { InternalServerError } from '../errors/AppError';

@injectable()
export class DocumentSearchService {
  constructor(
    @inject('ValidationService') private validationService: ValidationService,
    @inject('ExternalAPIOrchestrator') private apiOrchestrator: ExternalAPIOrchestrator,
    @inject('SalesSystemAPIClient') private salesApiClient: ISalesSystemAPIClient,
    @inject('ServiceSystemAPIClient') private serviceApiClient: IServiceSystemAPIClient,
    @inject('SearchHistoryRepository') private searchHistoryRepository: SearchHistoryRepository,
    @inject('Logger') private logger: Logger
  ) {}

  /**
   * Search documents by VIN
   * @param vin Vehicle Identification Number
   * @param limit Pagination limit
   * @param offset Pagination offset
   * @returns Aggregated search result from both systems
   */
  async searchByVin(
    vin: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AggregatedSearchResult> {
    const startTime = Date.now();
    const traceId = uuidv4();
    const vinNormalized = this.validationService.normalizeVin(vin);

    this.logger.info('Document search started', {
      vin: vinNormalized,
      traceId,
      limit,
      offset
    });

    try {
      // Validate VIN format
      this.validationService.validateVinFormat(vinNormalized);

      // Validate pagination
      const { limit: validLimit, offset: validOffset } = 
        this.validationService.validatePagination(limit, offset);

      // Call external APIs in parallel
      const apiResults = await this.apiOrchestrator.callAPIsInParallel(
        this.salesApiClient.search(vinNormalized),
        this.serviceApiClient.search(vinNormalized)
      );

      // Aggregate results
      const aggregatedResult = this.aggregateResults(
        apiResults.salesDocuments,
        apiResults.serviceDocuments,
        apiResults.salesSuccess,
        apiResults.serviceSuccess,
        apiResults.salesError,
        apiResults.serviceError,
        startTime,
        vinNormalized,
        validLimit,
        validOffset,
        traceId
      );

      // Log search to database (audit trail)
      await this.logSearchHistory(
        vinNormalized,
        aggregatedResult,
        apiResults.salesSuccess,
        apiResults.serviceSuccess,
        apiResults.salesError,
        apiResults.serviceError,
        startTime
      );

      this.logger.info('Document search completed successfully', {
        vin: vinNormalized,
        traceId,
        totalDocuments: aggregatedResult.documents.length,
        executionTimeMs: aggregatedResult.executionTimeMs
      });

      return aggregatedResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      this.logger.error('Document search failed', {
        vin: vinNormalized,
        traceId,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: executionTime
      });

      // Re-throw known errors, wrap unexpected errors
      if (error instanceof Error) {
        throw error;
      }

      throw new InternalServerError('An unexpected error occurred during search', {
        traceId,
        originalError: String(error)
      });
    }
  }

  /**
   * Aggregate results from both APIs
   */
  private aggregateResults(
    salesDocuments: Document[],
    serviceDocuments: Document[],
    salesSuccess: boolean,
    serviceSuccess: boolean,
    salesError: string | undefined,
    serviceError: string | undefined,
    startTime: number,
    vin: string,
    limit: number,
    offset: number,
    traceId: string
  ): AggregatedSearchResult {
    // Merge documents from both sources
    const allDocuments = [...salesDocuments, ...serviceDocuments];

    // Sort by creation date (newest first)
    allDocuments.sort((a, b) => 
      b.createdDate.getTime() - a.createdDate.getTime()
    );

    // Apply pagination
    const paginatedDocuments = this.validationService.paginateArray(
      allDocuments,
      offset,
      limit
    );

    // Build metadata
    const metadata: Metadata = {
      total: allDocuments.length,
      returned: paginatedDocuments.length,
      offset,
      limit,
      partial: this.apiOrchestrator.isPartial(salesSuccess, serviceSuccess)
    };

    // Build errors object if there are errors
    let errors: Errors | undefined;
    if (salesError || serviceError) {
      errors = {
        ...(salesError && { salesSystemError: salesError }),
        ...(serviceError && { serviceSystemError: serviceError })
      };
    }

    // Build links
    const self = `/api/v1/documents/search?vin=${vin}&offset=${offset}&limit=${limit}`;
    const hasNext = offset + limit < allDocuments.length;
    const hasPrev = offset > 0;

    const links: Links = {
      self,
      ...(hasNext && { next: `/api/v1/documents/search?vin=${vin}&offset=${offset + limit}&limit=${limit}` }),
      ...(hasPrev && { prev: `/api/v1/documents/search?vin=${vin}&offset=${Math.max(0, offset - limit)}&limit=${limit}` })
    };

    const executionTime = Date.now() - startTime;

    return new AggregatedSearchResult(
      paginatedDocuments,
      metadata,
      executionTime,
      errors,
      links
    );
  }

  /**
   * Log search to audit trail
   */
  private async logSearchHistory(
    vin: string,
    result: AggregatedSearchResult,
    salesSuccess: boolean,
    serviceSuccess: boolean,
    salesError: string | undefined,
    serviceError: string | undefined,
    startTime: number
  ): Promise<void> {
    try {
      const searchLog = new SearchLog(
        uuidv4(),
        vin,
        vin,
        result.metadata.total,
        result.getDocumentsBySource('SALES_SYSTEM').length,
        result.getDocumentsBySource('SERVICE_SYSTEM').length,
        result.executionTimeMs,
        salesSuccess,
        serviceSuccess,
        new Date(),
        undefined,
        undefined,
        salesError,
        serviceError
      );

      await this.searchHistoryRepository.create(searchLog);
    } catch (error) {
      // Log database error but don't fail the request
      this.logger.warn('Failed to log search history', {
        vin,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
