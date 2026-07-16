/**
 * SearchDocumentRequest DTO
 * Represents the request payload for document search
 */

import { IsString, Length, Matches, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { VIN_CONSTRAINTS, PAGINATION_DEFAULTS } from '../../domain/constants/DocumentTypes';

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = PAGINATION_DEFAULTS.OFFSET;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(PAGINATION_DEFAULTS.MAX_LIMIT)
  limit?: number = PAGINATION_DEFAULTS.LIMIT;
}

export class SearchDocumentRequest {
  @IsString()
  @Length(
    VIN_CONSTRAINTS.LENGTH,
    VIN_CONSTRAINTS.LENGTH,
    {
      message: VIN_CONSTRAINTS.DESCRIPTION
    }
  )
  @Matches(VIN_CONSTRAINTS.PATTERN, {
    message: VIN_CONSTRAINTS.DESCRIPTION
  })
  vin!: string;

  @IsOptional()
  pagination?: PaginationDto = new PaginationDto();
}
