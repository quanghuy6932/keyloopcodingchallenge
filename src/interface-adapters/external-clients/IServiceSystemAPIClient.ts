/**
 * IServiceSystemAPIClient Interface
 * Contract for Service System API client
 */

import { Document } from '../../domain/entities/Document';

export interface IServiceSystemAPIClient {
  /**
   * Search documents by VIN in Service System
   * @param vin Vehicle Identification Number
   * @returns Array of documents found in Service System
   */
  search(vin: string): Promise<Document[]>;
}
