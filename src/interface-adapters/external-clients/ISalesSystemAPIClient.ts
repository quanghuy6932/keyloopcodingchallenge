/**
 * ISalesSystemAPIClient Interface
 * Contract for Sales System API client
 */

import { Document } from '../../domain/entities/Document';

export interface ISalesSystemAPIClient {
  /**
   * Search documents by VIN in Sales System
   * @param vin Vehicle Identification Number
   * @returns Array of documents found in Sales System
   */
  search(vin: string): Promise<Document[]>;
}
