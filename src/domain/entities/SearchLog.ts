/**
 * SearchLog Entity
 * Represents a search history record for audit log
 */

export class SearchLog {
  constructor(
    public id: string, // UUID
    public vin: string,
    public vinNormalized: string,
    public totalDocumentsFound: number,
    public salesDocumentsFound: number,
    public serviceDocumentsFound: number,
    public executionTimeMs: number,
    public salesApiSuccess: boolean,
    public serviceApiSuccess: boolean,
    public createdAt: Date,
    public salesApiResponseTimeMs?: number,
    public serviceApiResponseTimeMs?: number,
    public salesApiErrorMessage?: string,
    public serviceApiErrorMessage?: string,
    public userId?: string,
    public userIpAddress?: string
  ) {}

  /**
   * Check if search was successful
   */
  isSuccessful(): boolean {
    return this.salesApiSuccess && this.serviceApiSuccess;
  }

  /**
   * Check if search had errors
   */
  hasErrors(): boolean {
    return !this.salesApiSuccess || !this.serviceApiSuccess;
  }

  /**
   * Check if search was partial (one API failed)
   */
  isPartial(): boolean {
    return (this.salesApiSuccess && !this.serviceApiSuccess) ||
           (!this.salesApiSuccess && this.serviceApiSuccess);
  }

  /**
   * Get summary of the search
   */
  getSummary(): string {
    if (this.isSuccessful()) {
      return `Found ${this.totalDocumentsFound} documents in ${this.executionTimeMs}ms`;
    }
    if (this.isPartial()) {
      return `Partial results: ${this.totalDocumentsFound} documents in ${this.executionTimeMs}ms`;
    }
    return `Failed search after ${this.executionTimeMs}ms`;
  }
}
