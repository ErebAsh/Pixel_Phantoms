/**
 * Global Error Handling Middleware
 * Standardizes API error responses across the application
 * 
 * @module middleware/errorMiddleware
 */

/**
 * Custom error class for API errors
 * @class ApiError
 * @extends Error
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handling middleware
 * Catches all errors and returns a consistent JSON response format
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response with standardized error format
 */
const errorHandler = (err, req, res, next) => {
  // Default to 500 Internal Server Error if no status code is set
  const statusCode = err.statusCode || 500;
  
  // Determine if we're in development or production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Base error response structure
  const errorResponse = {
    success: false,
    status: statusCode,
    message: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  // Add validation errors if present (e.g., from express-validator)
  if (err.errors) {
    errorResponse.errors = err.errors;
  }

  // Include stack trace only in development mode
  if (isDevelopment) {
    errorResponse.stack = err.stack;
  }

  // Log error details (in production, this would go to a logging service)
  console.error('Error Details:', {
    message: err.message,
    statusCode,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    timestamp: errorResponse.timestamp,
  });

  // Send the standardized error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Catches requests to undefined routes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(
    404,
    `Route ${req.originalUrl} not found`
  );
  next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch promise rejections
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  ApiError,
};
