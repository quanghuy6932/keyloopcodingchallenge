/**
 * ServiceSystemAPIClient
 * Implementation of Service System API client (Mocked)
 */

import { injectable, inject } from 'tsyringe';
import axios, { AxiosInstance } from 'axios';
import { Document } from '../../domain/entities/Document';
import { IServiceSystemAPIClient } from './IServiceSystemAPIClient';
import { Logger } from '../../frameworks/logger/Logger';
import { APIError } from '../../application/errors/AppError';

@injectable()
export class ServiceSystemAPIClient implements IServiceSystemAPIClient {
  private httpClient: AxiosInstance;
  private readonly baseUrl: string;

  constructor(@inject('Logger') private logger: Logger) {
    this.baseUrl = process.env.SERVICE_API_URL || 'http://localhost:3002';
    
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Search documents by VIN in Service System
   */
  async search(vin: string): Promise<Document[]> {
    try {
      this.logger.info('Calling Service System API', { vin });

      const response = await this.httpClient.get<ServiceAPIResponse>(
        '/api/service/documents',
        {
          params: { vin }
        }
      );

      const documents = this.mapResponseToDocuments(response.data);
      
      this.logger.info('Service System API response received', {
        vin,
        documentCount: documents.length
      });

      return documents;
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      
      this.logger.error('Service System API call failed', {
        vin,
        error: errorMessage
      });

      throw new APIError(
        `Service System API error: ${errorMessage}`,
        { originalError: error }
      );
    }
  }

  /**
   * Map API response to Document entities
   */
  private mapResponseToDocuments(response: ServiceAPIResponse): Document[] {
    if (!response.documents || !Array.isArray(response.documents)) {
      return [];
    }

    return response.documents.map((doc: ServiceDocument) => 
      new Document(
        `${doc.id}`,
        doc.id,
        doc.vin || '',
        doc.title,
        (doc.type as any) || 'OTHER',
        'SERVICE_SYSTEM',
        new Date(doc.createdDate),
        new Date(doc.modifiedDate),
        doc.contentUrl,
        doc.size || 0,
        doc.metadata
      )
    );
  }

  /**
   * Extract error message from various error types
   */
  private extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.message || 'Unknown error';
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}

/**
 * Type definitions for Service API response
 */
interface ServiceDocument {
  id: string;
  title: string;
  type: string;
  vin?: string;
  createdDate: string;
  modifiedDate: string;
  contentUrl: string;
  size?: number;
  metadata?: Record<string, unknown>;
}

interface ServiceAPIResponse {
  documents: ServiceDocument[];
  metadata?: {
    total: number;
    returned: number;
  };
}
