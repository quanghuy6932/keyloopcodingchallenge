/**
 * SearchHistoryRepository
 * In-memory implementation for MVP (can be replaced with database implementation)
 */

import { injectable } from 'tsyringe';
import { SearchLog } from '../../domain/entities/SearchLog';

@injectable()
export class SearchHistoryRepository {
  // In-memory storage for MVP
  private searchLogs: Map<string, SearchLog> = new Map();
  // Simple ID counter
  private idCounter = 0;

  /**
   * Create a new search log entry
   */
  async create(searchLog: SearchLog): Promise<SearchLog> {
    this.searchLogs.set(searchLog.id, searchLog);
    return searchLog;
  }

  /**
   * Find search logs by VIN
   */
  async findByVin(vin: string): Promise<SearchLog[]> {
    const vinNormalized = vin.toUpperCase();
    return Array.from(this.searchLogs.values())
      .filter(log => log.vinNormalized === vinNormalized)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get all search logs with pagination
   */
  async findAll(limit: number = 20, offset: number = 0): Promise<{
    logs: SearchLog[];
    total: number;
  }> {
    const allLogs = Array.from(this.searchLogs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = allLogs.length;
    const logs = allLogs.slice(offset, offset + limit);

    return { logs, total };
  }

  /**
   * Delete search logs older than specified days
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let deletedCount = 0;
    for (const [id, log] of this.searchLogs.entries()) {
      if (log.createdAt < cutoffDate) {
        this.searchLogs.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Clear all logs (for testing)
   */
  async clear(): Promise<void> {
    this.searchLogs.clear();
  }

  /**
   * Get repository size (for testing)
   */
  getSize(): number {
    return this.searchLogs.size;
  }
}
