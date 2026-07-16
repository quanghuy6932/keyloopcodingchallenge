/**
 * ValidationService Unit Tests
 * Tests input validation logic for VIN and pagination
 */

import { ValidationService } from '../../../src/application/services/ValidationService';
import { ValidationError } from '../../../src/application/errors/AppError';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('validateVinFormat', () => {
    it('should accept valid 17-character alphanumeric VIN', () => {
      const validVin = 'WBADT43452G808140';
      expect(() => validationService.validateVinFormat(validVin)).not.toThrow();
    });

    it('should accept VIN with numbers and uppercase letters', () => {
      const validVin = '1HGBH41JXMN109186';
      expect(() => validationService.validateVinFormat(validVin)).not.toThrow();
    });

    it('should throw ValidationError for VIN shorter than 17 chars', () => {
      const invalidVin = 'WBADT43452G80814';
      expect(() => validationService.validateVinFormat(invalidVin)).toThrow(ValidationError);
    });

    it('should throw ValidationError for VIN longer than 17 chars', () => {
      const invalidVin = 'WBADT43452G8081401';
      expect(() => validationService.validateVinFormat(invalidVin)).toThrow(ValidationError);
    });

    it('should throw ValidationError for VIN with lowercase letters', () => {
      const invalidVin = 'wbadt43452g808140';
      expect(() => validationService.validateVinFormat(invalidVin)).toThrow(ValidationError);
    });

    it('should throw ValidationError for VIN with special characters', () => {
      const invalidVin = 'WBADT43452G8081@0';
      expect(() => validationService.validateVinFormat(invalidVin)).toThrow(ValidationError);
    });

    it('should throw ValidationError for VIN with spaces', () => {
      const invalidVin = 'WBADT43452 G80814';
      expect(() => validationService.validateVinFormat(invalidVin)).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty VIN', () => {
      const invalidVin = '';
      expect(() => validationService.validateVinFormat(invalidVin)).toThrow(ValidationError);
    });
  });

  describe('normalizeVin', () => {
    it('should convert lowercase VIN to uppercase', () => {
      const result = validationService.normalizeVin('wbadt43452g808140');
      expect(result).toBe('WBADT43452G808140');
    });

    it('should trim whitespace from VIN', () => {
      const result = validationService.normalizeVin('  WBADT43452G808140  ');
      expect(result).toBe('WBADT43452G808140');
    });

    it('should handle mixed case and whitespace', () => {
      const result = validationService.normalizeVin('  wbadt43452g808140  ');
      expect(result).toBe('WBADT43452G808140');
    });

    it('should return same VIN if already normalized', () => {
      const result = validationService.normalizeVin('WBADT43452G808140');
      expect(result).toBe('WBADT43452G808140');
    });
  });

  describe('validatePagination', () => {
    it('should accept valid pagination parameters', () => {
      const result = validationService.validatePagination(10, 0);
      expect(result).toEqual({ limit: 10, offset: 0 });
    });

    it('should return defaults when no parameters provided', () => {
      const result = validationService.validatePagination(undefined, undefined);
      expect(result.limit).toBeDefined();
      expect(result.offset).toBeDefined();
    });

    it('should throw ValidationError for negative limit', () => {
      expect(() => validationService.validatePagination(-1, 0)).toThrow(ValidationError);
    });

    it('should throw ValidationError for zero limit', () => {
      expect(() => validationService.validatePagination(0, 0)).toThrow(ValidationError);
    });

    it('should throw ValidationError for negative offset', () => {
      expect(() => validationService.validatePagination(10, -1)).toThrow(ValidationError);
    });

    it('should throw ValidationError for limit exceeding maximum (1000)', () => {
      expect(() => validationService.validatePagination(1001, 0)).toThrow(ValidationError);
    });

    it('should accept maximum valid limit (1000)', () => {
      const result = validationService.validatePagination(1000, 0);
      expect(result.limit).toBe(1000);
    });

    it('should accept large offset values', () => {
      const result = validationService.validatePagination(10, 10000);
      expect(result.offset).toBe(10000);
    });
  });

  describe('paginateArray', () => {
    const mockArray = [
      { id: '1', name: 'Doc1' },
      { id: '2', name: 'Doc2' },
      { id: '3', name: 'Doc3' },
      { id: '4', name: 'Doc4' },
      { id: '5', name: 'Doc5' },
    ];

    it('should return first 2 items with offset 0', () => {
      const result = validationService.paginateArray(mockArray, 0, 2);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('should return items with offset 2 and limit 2', () => {
      const result = validationService.paginateArray(mockArray, 2, 2);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('3');
      expect(result[1].id).toBe('4');
    });

    it('should return remaining items when limit exceeds available items', () => {
      const result = validationService.paginateArray(mockArray, 3, 10);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('4');
      expect(result[1].id).toBe('5');
    });

    it('should return empty array when offset exceeds array length', () => {
      const result = validationService.paginateArray(mockArray, 10, 2);
      expect(result).toHaveLength(0);
    });

    it('should return all items with large limit', () => {
      const result = validationService.paginateArray(mockArray, 0, 1000);
      expect(result).toHaveLength(5);
    });

    it('should return empty array for empty input array', () => {
      const result = validationService.paginateArray([], 0, 10);
      expect(result).toHaveLength(0);
    });
  });
});
