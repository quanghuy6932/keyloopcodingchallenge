/**
 * AggregatedSearchResult Entity
 * Represents the final result of a document search across systems
 */

import { Document } from './Document';

export interface Metadata {
  total: number;
  returned: number;
  offset: number;
  limit: number;
  partial: boolean; // true if one API failed
}

export interface Errors {
  salesSystemError?: string;
  serviceSystemError?: string;
}

export interface Links {
  self: string;
  next?: string;
  prev?: string;
}

export class AggregatedSearchResult {
  constructor(
    public documents: Document[],
    public metadata: Metadata,
    public executionTimeMs: number,
    public errors?: Errors,
    public links?: Links
  ) {}

  /**
   * Check if search was successful (no errors)
   */
  isSuccessful(): boolean {
    return !this.errors || (Object.keys(this.errors).length === 0);
  }

  /**
   * Check if result is partial (one API failed)
   */
  isPartial(): boolean {
    return this.metadata.partial;
  }

  /**
   * Get total number of sales documents
   */
  getSalesDocumentCount(): number {
    return this.documents.filter(doc => doc.isSalesDocument()).length;
  }

  /**
   * Get total number of service documents
   */
  getServiceDocumentCount(): number {
    return this.documents.filter(doc => doc.isServiceDocument()).length;
  }

  /**
   * Filter documents by source
   */
  getDocumentsBySource(source: 'SALES_SYSTEM' | 'SERVICE_SYSTEM'): Document[] {
    return this.documents.filter(doc => doc.source === source);
  }

  /**
   * Sort documents by creation date (newest first)
   */
  sortByNewestFirst(): Document[] {
    return [...this.documents].sort((a, b) => 
      b.createdDate.getTime() - a.createdDate.getTime()
    );
  }

  /**
   * Sort documents by oldest first
   */
  sortByOldestFirst(): Document[] {
    return [...this.documents].sort((a, b) => 
      a.createdDate.getTime() - b.createdDate.getTime()
    );
  }
}
