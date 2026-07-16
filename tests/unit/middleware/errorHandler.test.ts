import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from '../../../src/interface-adapters/middleware/errorHandler';
import { ValidationError, APIError } from '../../../src/application/errors/AppError';

describe('errorHandler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    jsonSpy = jest.fn().mockReturnValue(undefined);
    statusSpy = jest.fn().mockReturnValue({
      json: jsonSpy
    });
    mockResponse = {
      status: statusSpy
    };
    mockNext = jest.fn();
  });

  describe('AppError instances', () => {
    it('should handle ValidationError with 400 status', () => {
      const error = new ValidationError('Invalid VIN');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalled();
      const callArgs = jsonSpy.mock.calls[0][0];
      expect(callArgs.message).toBe('Invalid VIN');
      expect(callArgs.code).toContain('VALIDATION');
      expect(callArgs.timestamp).toBeDefined();
    });

    it('should handle APIError', () => {
      const error = new APIError('External API failed', 'API_FAILURE', 'TestAPI');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalled();
      const callArgs = jsonSpy.mock.calls[0][0];
      expect(callArgs.message).toBe('External API failed');
      expect(callArgs.timestamp).toBeDefined();
    });
  });

  describe('Generic errors', () => {
    it('should handle generic Error with 500 status', () => {
      const error = new Error('Unexpected error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalled();
      const callArgs = jsonSpy.mock.calls[0][0];
      expect(callArgs.code).toBe('INTERNAL_SERVER_ERROR');
      expect(callArgs.timestamp).toBeDefined();
    });

    it('should handle error with no message', () => {
      const error = new Error();
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalled();
      const callArgs = jsonSpy.mock.calls[0][0];
      expect(callArgs.code).toBe('INTERNAL_SERVER_ERROR');
      expect(callArgs.timestamp).toBeDefined();
    });

    it('should always include timestamp in response', () => {
      const error = new ValidationError('Test error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonSpy).toHaveBeenCalled();
      const callArgs = jsonSpy.mock.calls[0][0];
      expect(callArgs.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});

describe('notFoundHandler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/api/nonexistent'
    };
    jsonSpy = jest.fn().mockReturnValue(undefined);
    statusSpy = jest.fn().mockReturnValue({
      json: jsonSpy
    });
    mockResponse = {
      status: statusSpy
    };
    mockNext = jest.fn();
  });

  it('should return 404 status for not found routes', () => {
    notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusSpy).toHaveBeenCalledWith(404);
    expect(jsonSpy).toHaveBeenCalled();
    const callArgs = jsonSpy.mock.calls[0][0];
    expect(callArgs.message).toBeDefined();
    expect(callArgs.timestamp).toBeDefined();
  });

  it('should include error information in response', () => {
    notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);

    expect(jsonSpy).toHaveBeenCalled();
    const callArgs = jsonSpy.mock.calls[0][0];
    expect(callArgs.message).toContain('GET');
    expect(callArgs.message).toContain('nonexistent');
  });

  it('should always return 404 status', () => {
    notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);
    expect(statusSpy).toHaveBeenCalledWith(404);

    jsonSpy.mockClear();
    statusSpy.mockClear();
    
    mockRequest.method = 'POST';
    mockRequest.path = '/api/another-missing-route';
    notFoundHandler(mockRequest as Request, mockResponse as Response, mockNext);
    expect(statusSpy).toHaveBeenCalledWith(404);
  });
});
