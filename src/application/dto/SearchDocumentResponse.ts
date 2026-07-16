/**
 * SearchDocumentResponse DTO
 * Represents the response payload for document search
 */

import { Document } from '../../domain/entities/Document';

export class DocumentDTO {
  constructor(
    public id: string,
    public documentId: string,
    public vin: string,
    public title: string,
    public type: string,
    public source: string,
    public createdDate: string, // ISO 8601
    public modifiedDate: string, // ISO 8601
    public contentUrl: string,
    public size: number,
    public metadata?: Record<string, unknown>
  ) {}

  /**
   * Factory method to create DTO from Document entity
   */
  static fromEntity(document: Document): DocumentDTO {
    return new DocumentDTO(
      document.id,
      document.documentId,
      document.vin,
      document.title,
      document.type,
      document.source,
      document.createdDate.toISOString(),
      document.modifiedDate.toISOString(),
      document.contentUrl,
      document.size,
      document.metadata
    );
  }
}

export class MetadataDTO {
  constructor(
    public total: number,
    public returned: number,
    public offset: number,
    public limit: number,
    public partial: boolean
  ) {}
}

export class ErrorsDTO {
  constructor(
    public salesSystemError?: string,
    public serviceSystemError?: string
  ) {}
}

export class LinksDTO {
  constructor(
    public self: string,
    public next?: string,
    public prev?: string
  ) {}
}

export class SearchDocumentResponse {
  constructor(
    public documents: DocumentDTO[],
    public metadata: MetadataDTO,
    public executionTimeMs: number,
    public errors?: ErrorsDTO,
    public _links?: LinksDTO
  ) {}
}
