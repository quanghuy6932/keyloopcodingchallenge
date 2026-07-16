/**
 * AppError Base Class
 * Custom error class for application errors
 */

export class AppError extends Error {
  public readonly timestamp: Date;

  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert error to JSON response
   */
  toJSON() {
    return {
      error: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp.toISOString()
    };
  }
}

/**
 * ValidationError
 * Thrown when input validation fails
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(
      'VALIDATION_ERROR',
      message,
      400,
      details
    );
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * APIError
 * Thrown when external API call fails
 */
export class APIError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(
      'EXTERNAL_API_ERROR',
      message,
      500,
      details
    );
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * TimeoutError
 * Thrown when API call times out
 */
export class TimeoutError extends AppError {
  constructor(
    message: string = 'Request timeout',
    details?: Record<string, unknown>
  ) {
    super(
      'TIMEOUT_ERROR',
      message,
      503,
      details
    );
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * DatabaseError
 * Thrown when database operation fails
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    details?: Record<string, unknown>
  ) {
    super(
      'DATABASE_ERROR',
      message,
      500,
      details
    );
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * NotFoundError
 * Thrown when resource not found
 */
export class NotFoundError extends AppError {
  constructor(
    message: string = 'Resource not found',
    details?: Record<string, unknown>
  ) {
    super(
      'NOT_FOUND_ERROR',
      message,
      404,
      details
    );
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * InternalServerError
 * Thrown for unexpected server errors
 */
export class InternalServerError extends AppError {
  constructor(
    message: string = 'Internal server error',
    details?: Record<string, unknown>
  ) {
    super(
      'INTERNAL_SERVER_ERROR',
      message,
      500,
      details
    );
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
