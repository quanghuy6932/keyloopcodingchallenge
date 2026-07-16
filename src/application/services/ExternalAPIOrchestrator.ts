/**
 * ExternalAPIOrchestrator Service
 * Orchestrates parallel calls to external APIs with timeout management
 */

import { injectable, inject } from 'tsyringe';
import { Document } from '../../domain/entities/Document';
import { TimeoutError, APIError } from '../errors/AppError';
import { API_TIMEOUTS } from '../../domain/constants/DocumentTypes';
import { Logger } from '../../frameworks/logger/Logger';

export interface APICallResult {
  success: boolean;
  documents: Document[];
  errorMessage?: string;
  responseTimeMs?: number;
}

@injectable()
export class ExternalAPIOrchestrator {
  constructor(@inject('Logger') private logger: Logger) {}

  /**
   * Execute parallel API calls with timeout management
   * @param salesApiCall Promise for Sales API call
   * @param serviceApiCall Promise for Service API call
   * @returns Combined results from both APIs
   */
  async callAPIsInParallel(
    salesApiCall: Promise<Document[]>,
    serviceApiCall: Promise<Document[]>
  ): Promise<{
    salesDocuments: Document[];
    serviceDocuments: Document[];
    salesError?: string;
    serviceError?: string;
    salesSuccess: boolean;
    serviceSuccess: boolean;
  }> {
    const startTime = Date.now();

    // Wrap individual promises with timeout
    const salesWithTimeout = this.addTimeout(
      salesApiCall,
      API_TIMEOUTS.INDIVIDUAL_API_TIMEOUT_MS,
      'Sales System API'
    );

    const serviceWithTimeout = this.addTimeout(
      serviceApiCall,
      API_TIMEOUTS.INDIVIDUAL_API_TIMEOUT_MS,
      'Service System API'
    );

    // Execute both in parallel and handle partial failures
    const results = await Promise.allSettled([
      salesWithTimeout,
      serviceWithTimeout
    ]);

    const salesResult = results[0];
    const serviceResult = results[1];

    let salesDocuments: Document[] = [];
    let salesError: string | undefined;
    let salesSuccess = false;
    let salesResponseTimeMs: number | undefined;

    if (salesResult.status === 'fulfilled') {
      salesDocuments = salesResult.value;
      salesSuccess = true;
      salesResponseTimeMs = Date.now() - startTime;
      this.logger.info('Sales API call successful', {
        documentCount: salesDocuments.length,
        responseTimeMs: salesResponseTimeMs
      });
    } else {
      salesError = salesResult.reason?.message || 'Unknown error';
      salesResponseTimeMs = Date.now() - startTime;
      this.logger.warn('Sales API call failed', {
        error: salesError,
        responseTimeMs: salesResponseTimeMs
      });
    }

    let serviceDocuments: Document[] = [];
    let serviceError: string | undefined;
    let serviceSuccess = false;
    let serviceResponseTimeMs: number | undefined;

    if (serviceResult.status === 'fulfilled') {
      serviceDocuments = serviceResult.value;
      serviceSuccess = true;
      serviceResponseTimeMs = Date.now() - startTime;
      this.logger.info('Service API call successful', {
        documentCount: serviceDocuments.length,
        responseTimeMs: serviceResponseTimeMs
      });
    } else {
      serviceError = serviceResult.reason?.message || 'Unknown error';
      serviceResponseTimeMs = Date.now() - startTime;
      this.logger.warn('Service API call failed', {
        error: serviceError,
        responseTimeMs: serviceResponseTimeMs
      });
    }

    return {
      salesDocuments,
      serviceDocuments,
      salesError,
      serviceError,
      salesSuccess,
      serviceSuccess
    };
  }

  /**
   * Wrap a promise with timeout
   * @param promise Promise to wrap
   * @param timeoutMs Timeout in milliseconds
   * @param serviceName Name of service for error messaging
   * @returns Promise that rejects with TimeoutError if timeout exceeded
   */
  private addTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    serviceName: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => {
            const error = new TimeoutError(
              `${serviceName} request timeout after ${timeoutMs}ms`
            );
            reject(error);
          },
          timeoutMs
        )
      )
    ]);
  }

  /**
   * Check if at least one API succeeded
   * @param salesSuccess Sales API success status
   * @param serviceSuccess Service API success status
   * @returns true if at least one succeeded
   */
  hasAtLeastOneSuccess(salesSuccess: boolean, serviceSuccess: boolean): boolean {
    return salesSuccess || serviceSuccess;
  }

  /**
   * Check if both APIs failed
   * @param salesSuccess Sales API success status
   * @param serviceSuccess Service API success status
   * @returns true if both failed
   */
  bothFailed(salesSuccess: boolean, serviceSuccess: boolean): boolean {
    return !salesSuccess && !serviceSuccess;
  }

  /**
   * Check if result is partial (one API failed)
   * @param salesSuccess Sales API success status
   * @param serviceSuccess Service API success status
   * @returns true if exactly one API failed
   */
  isPartial(salesSuccess: boolean, serviceSuccess: boolean): boolean {
    return (salesSuccess && !serviceSuccess) || (!salesSuccess && serviceSuccess);
  }
}
