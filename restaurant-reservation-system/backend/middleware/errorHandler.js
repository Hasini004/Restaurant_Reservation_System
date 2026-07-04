/**
 * Custom error class so controllers can throw errors with a specific
 * HTTP status code, e.g. `throw new ApiError(404, 'Table not found')`.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

/** 404 handler for unmatched routes. */
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Centralized error handler. Every error in the app (thrown ApiErrors,
 * Mongoose errors, unexpected exceptions) ends up here via next(err)
 * or an async wrapper, so the API always returns a consistent shape.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field
      ? `${field} already exists.`
      : 'Duplicate value violates a unique constraint.';
  }

  // JWT errors (in case they bubble up outside the auth middleware)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Wraps an async route handler so thrown errors / rejected promises
 * are forwarded to the error handler instead of crashing the process.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { ApiError, notFound, errorHandler, asyncHandler };
