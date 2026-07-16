/**
 * Document Entity
 * Represents a document from either Sales or Service system
 */

export type DocumentSource = 'SALES_SYSTEM' | 'SERVICE_SYSTEM';
export type DocumentType = 'CONTRACT' | 'INVOICE' | 'MAINTENANCE_RECORD' | 'REGISTRATION' | 'WARRANTY_CLAIM' | 'QUOTATION' | 'OTHER';

export class Document {
  constructor(
    public id: string, // UUID or system-specific ID
    public documentId: string, // Unique within source system
    public vin: string,
    public title: string,
    public type: DocumentType,
    public source: DocumentSource,
    public createdDate: Date,
    public modifiedDate: Date,
    public contentUrl: string, // Mock file path or S3 URL
    public size: number, // bytes
    public metadata?: Record<string, unknown>
  ) {}

  /**
   * Get display name for source system
   */
  getSourceLabel(): string {
    return this.source === 'SALES_SYSTEM' ? 'Sales System' : 'Service System';
  }

  /**
   * Get human-readable document type
   */
  getTypeLabel(): string {
    const typeLabels: Record<DocumentType, string> = {
      CONTRACT: 'Contract',
      INVOICE: 'Invoice',
      MAINTENANCE_RECORD: 'Maintenance Record',
      REGISTRATION: 'Registration',
      WARRANTY_CLAIM: 'Warranty Claim',
      QUOTATION: 'Quotation',
      OTHER: 'Other'
    };
    return typeLabels[this.type];
  }

  /**
   * Check if document is from sales system
   */
  isSalesDocument(): boolean {
    return this.source === 'SALES_SYSTEM';
  }

  /**
   * Check if document is from service system
   */
  isServiceDocument(): boolean {
    return this.source === 'SERVICE_SYSTEM';
  }

  /**
   * Get size in human-readable format
   */
  getFormattedSize(): string {
    const KB = 1024;
    const MB = KB * 1024;

    if (this.size >= MB) {
      return `${(this.size / MB).toFixed(2)} MB`;
    }
    if (this.size >= KB) {
      return `${(this.size / KB).toFixed(2)} KB`;
    }
    return `${this.size} bytes`;
  }
}
