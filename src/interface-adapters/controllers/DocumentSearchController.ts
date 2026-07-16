/**
 * DocumentSearchController
 * Handles HTTP requests for document search
 */

import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DocumentSearchService } from '../../application/services/DocumentSearchService';
import { SearchHistoryRepository } from '../repositories/SearchHistoryRepository';
import { SearchDocumentRequest } from '../../application/dto/SearchDocumentRequest';
import { SearchDocumentResponse, DocumentDTO, MetadataDTO, ErrorsDTO, LinksDTO } from '../../application/dto/SearchDocumentResponse';
import { ValidationError } from '../../application/errors/AppError';
import { Logger } from '../../frameworks/logger/Logger';

@injectable()
export class DocumentSearchController {
  constructor(
    @inject('DocumentSearchService') private documentSearchService: DocumentSearchService,
    @inject('SearchHistoryRepository') private searchHistoryRepository: SearchHistoryRepository,
    @inject('Logger') private logger: Logger
  ) {}

  /**
   * Handle POST /documents/search request
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const searchRequest = plainToInstance(SearchDocumentRequest, req.body);
      const validationErrors = await validate(searchRequest);

      if (validationErrors.length > 0) {
        const errorMessages = validationErrors
          .map(err => Object.values(err.constraints || {}).join(', '))
          .join('; ');
        
        throw new ValidationError(errorMessages, {
          field: validationErrors[0]?.property,
          constraints: validationErrors[0]?.constraints
        });
      }

      // Execute search
      const result = await this.documentSearchService.searchByVin(
        searchRequest.vin,
        searchRequest.pagination?.limit,
        searchRequest.pagination?.offset
      );

      // Map to DTO
      const responseDto = new SearchDocumentResponse(
        result.documents.map(doc => DocumentDTO.fromEntity(doc)),
        new MetadataDTO(
          result.metadata.total,
          result.metadata.returned,
          result.metadata.offset,
          result.metadata.limit,
          result.metadata.partial
        ),
        result.executionTimeMs,
        result.errors ? new ErrorsDTO(
          result.errors.salesSystemError,
          result.errors.serviceSystemError
        ) : undefined,
        result.links ? new LinksDTO(
          result.links.self,
          result.links.next,
          result.links.prev
        ) : undefined
      );

      // Determine status code based on result
      const statusCode = result.isSuccessful() ? 200 : 200; // Always 200 even for partial success

      res.status(statusCode).json(responseDto);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle GET /documents/search-history request
   */
  async searchHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

      const { logs, total } = await this.searchHistoryRepository.findAll(limit, offset);

      res.status(200).json({
        searches: logs.map(log => ({
          id: log.id,
          vin: log.vin,
          totalDocumentsFound: log.totalDocumentsFound,
          salesDocumentsFound: log.salesDocumentsFound,
          serviceDocumentsFound: log.serviceDocumentsFound,
          executionTimeMs: log.executionTimeMs,
          salesApiSuccess: log.salesApiSuccess,
          serviceApiSuccess: log.serviceApiSuccess,
          createdAt: log.createdAt.toISOString()
        })),
        metadata: {
          total,
          returned: logs.length,
          offset,
          limit
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
