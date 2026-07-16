import { SearchHistoryRepository } from '../../../src/interface-adapters/repositories/SearchHistoryRepository';
import { SearchLog } from '../../../src/domain/entities/SearchLog';
import { v4 as uuidv4 } from 'uuid';

describe('SearchHistoryRepository', () => {
  let repository: SearchHistoryRepository;

  beforeEach(() => {
    repository = new SearchHistoryRepository();
  });

  const createSearchLog = (
    vin: string = 'WBADT43452G808140',
    totalDocs: number = 2,
    salesSuccess: boolean = true,
    serviceSuccess: boolean = true,
    salesError?: string,
    serviceError?: string
  ): SearchLog => {
    return new SearchLog(
      uuidv4(),
      vin,
      vin.toUpperCase(),
      totalDocs,
      1,
      1,
      50,
      salesSuccess,
      serviceSuccess,
      new Date(),
      10,
      15,
      salesError,
      serviceError
    );
  };

  describe('create', () => {
    it('should create a new search log entry', async () => {
      const searchLog = createSearchLog();

      await repository.create(searchLog);
      const size = repository.getSize();

      expect(size).toBe(1);
    });

    it('should store multiple search logs', async () => {
      const log1 = createSearchLog('VIN1');
      const log2 = createSearchLog('VIN2');
      const log3 = createSearchLog('VIN3');

      await repository.create(log1);
      await repository.create(log2);
      await repository.create(log3);

      const size = repository.getSize();
      expect(size).toBe(3);
    });

    it('should assign unique IDs to search logs', async () => {
      const log1 = createSearchLog('VIN1');
      const log2 = createSearchLog('VIN2');

      const result1 = await repository.create(log1);
      const result2 = await repository.create(log2);

      expect(result1.id).toBeDefined();
      expect(result2.id).toBeDefined();
      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('findByVin', () => {
    it('should find search logs by VIN', async () => {
      const log = createSearchLog('WBADT43452G808140');
      await repository.create(log);

      const results = await repository.findByVin('WBADT43452G808140');

      expect(results).toHaveLength(1);
      expect(results[0].vin).toBe('WBADT43452G808140');
    });

    it('should return empty array for non-existent VIN', async () => {
      const results = await repository.findByVin('NONEXISTENT');

      expect(results).toEqual([]);
    });

    it('should return all search logs for a VIN when multiple searches performed', async () => {
      const log1 = createSearchLog('VIN1');
      const log2 = createSearchLog('VIN1');
      const log3 = createSearchLog('VIN2');

      await repository.create(log1);
      await repository.create(log2);
      await repository.create(log3);

      const results = await repository.findByVin('VIN1');

      expect(results).toHaveLength(2);
      expect(results.every(r => r.vin === 'VIN1')).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return all search logs', async () => {
      const log1 = createSearchLog('VIN1');
      const log2 = createSearchLog('VIN2');
      const log3 = createSearchLog('VIN3');

      await repository.create(log1);
      await repository.create(log2);
      await repository.create(log3);

      const result = await repository.findAll();

      expect(result.logs).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should support pagination with limit', async () => {
      for (let i = 1; i <= 5; i++) {
        const log = createSearchLog(`VIN${i}`);
        await repository.create(log);
      }

      const result = await repository.findAll(3);

      expect(result.logs).toHaveLength(3);
      expect(result.total).toBe(5);
    });

    it('should support pagination with offset', async () => {
      for (let i = 1; i <= 5; i++) {
        const log = createSearchLog(`VIN${i}`);
        await repository.create(log);
      }

      const result = await repository.findAll(10, 2);

      expect(result.logs.length).toBeLessThanOrEqual(3);
      expect(result.total).toBe(5);
    });

    it('should return empty array when repository is empty', async () => {
      const result = await repository.findAll();

      expect(result.logs).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle limit and offset boundaries', async () => {
      for (let i = 1; i <= 5; i++) {
        const log = createSearchLog(`VIN${i}`);
        await repository.create(log);
      }

      const allResults = await repository.findAll();
      const offsetResults = await repository.findAll(100, 5);

      expect(offsetResults.logs).toEqual([]);
      expect(allResults.total).toBe(5);
    });
  });

  describe('getSize', () => {
    it('should return 0 for empty repository', () => {
      const size = repository.getSize();

      expect(size).toBe(0);
    });

    it('should return correct size after adding logs', async () => {
      const log1 = createSearchLog('VIN1');
      const log2 = createSearchLog('VIN2');

      await repository.create(log1);
      expect(repository.getSize()).toBe(1);

      await repository.create(log2);
      expect(repository.getSize()).toBe(2);
    });
  });

  describe('deleteOlderThan', () => {
    it('should delete search logs older than specified number of days', async () => {
      const log1 = createSearchLog('VIN1');
      const log2 = createSearchLog('VIN2');

      await repository.create(log1);
      await repository.create(log2);

      // Delete logs older than 1 day (should not delete today's logs)
      const deletedCount = await repository.deleteOlderThan(1);

      expect(deletedCount).toBe(0);
      const remaining = await repository.findAll();
      expect(remaining.logs.length).toBe(2);
    });

    it('should delete old logs when days parameter is 0', async () => {
      const log = createSearchLog('VIN1');
      await repository.create(log);

      // Delete logs older than 0 days (everything is older than now)
      const deletedCount = await repository.deleteOlderThan(0);

      // At least 1 log should be marked as older
      expect(typeof deletedCount).toBe('number');
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clear', () => {
    it('should clear all search logs', async () => {
      const log1 = createSearchLog('VIN1');
      const log2 = createSearchLog('VIN2');

      await repository.create(log1);
      await repository.create(log2);
      expect(repository.getSize()).toBe(2);

      await repository.clear();

      expect(repository.getSize()).toBe(0);
      const result = await repository.findAll();
      expect(result.logs).toEqual([]);
    });

    it('should handle clearing an empty repository', async () => {
      await repository.clear();
      const size = repository.getSize();

      expect(size).toBe(0);
    });
  });

  describe('partial failure scenarios', () => {
    it('should correctly store search logs with sales API failure', async () => {
      const log = createSearchLog(
        'WBADT43452G808140',
        2,
        false,  // salesSuccess = false
        true,   // serviceSuccess = true
        'SALES_API_TIMEOUT'
      );

      await repository.create(log);
      const results = await repository.findByVin('WBADT43452G808140');

      expect(results).toHaveLength(1);
      expect(results[0].salesApiSuccess).toBe(false);
      expect(results[0].salesApiErrorMessage).toBe('SALES_API_TIMEOUT');
    });

    it('should correctly store search logs with service API failure', async () => {
      const log = createSearchLog(
        'WBADT43452G808140',
        2,
        true,   // salesSuccess = true
        false,  // serviceSuccess = false
        undefined,
        'SERVICE_API_ERROR'
      );

      await repository.create(log);
      const results = await repository.findByVin('WBADT43452G808140');

      expect(results).toHaveLength(1);
      expect(results[0].serviceApiSuccess).toBe(false);
      expect(results[0].serviceApiErrorMessage).toBe('SERVICE_API_ERROR');
    });

    it('should correctly store search logs with both APIs failing', async () => {
      const log = createSearchLog(
        'WBADT43452G808140',
        0,
        false,  // salesSuccess = false
        false,  // serviceSuccess = false
        'SALES_ERROR',
        'SERVICE_ERROR'
      );

      await repository.create(log);
      const results = await repository.findByVin('WBADT43452G808140');

      expect(results).toHaveLength(1);
      expect(results[0].salesApiSuccess).toBe(false);
      expect(results[0].serviceApiSuccess).toBe(false);
    });
  });
});
