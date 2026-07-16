/**
 * ValidationService
 * Handles validation of input data
 */

import { injectable } from 'tsyringe';
import { ValidationError } from '../errors/AppError';
import { VIN_CONSTRAINTS } from '../../domain/constants/DocumentTypes';

@injectable()
export class ValidationService {
  /**
   * Validate VIN format
   * @param vin Vehicle Identification Number (must be 17 characters, alphanumeric)
   * @throws ValidationError if VIN format is invalid
   */
  validateVinFormat(vin: string): void {
    if (!vin) {
      throw new ValidationError('VIN is required');
    }

    if (typeof vin !== 'string') {
      throw new ValidationError('VIN must be a string');
    }

    if (vin.length !== VIN_CONSTRAINTS.LENGTH) {
      throw new ValidationError(VIN_CONSTRAINTS.DESCRIPTION);
    }

    if (!VIN_CONSTRAINTS.PATTERN.test(vin)) {
      throw new ValidationError(VIN_CONSTRAINTS.DESCRIPTION);
    }
  }

  /**
   * Normalize VIN to uppercase
   * @param vin Raw VIN string
   * @returns Normalized VIN (uppercase)
   */
  normalizeVin(vin: string): string {
    return vin.toUpperCase().trim();
  }

  /**
   * Validate pagination parameters
   * @param limit Items per page
   * @param offset Starting offset
   * @throws ValidationError if parameters are invalid
   */
  validatePagination(limit?: number, offset?: number): { limit: number; offset: number } {
    const finalLimit = limit ?? 100;
    const finalOffset = offset ?? 0;

    if (finalLimit < 1 || finalLimit > 1000) {
      throw new ValidationError('Limit must be between 1 and 1000');
    }

    if (finalOffset < 0) {
      throw new ValidationError('Offset cannot be negative');
    }

    return { limit: finalLimit, offset: finalOffset };
  }

  /**
   * Apply pagination to array
   * @param items Array to paginate
   * @param offset Starting offset
   * @param limit Items per page
   * @returns Paginated items
   */
  paginateArray<T>(items: T[], offset: number, limit: number): T[] {
    return items.slice(offset, offset + limit);
  }
}
