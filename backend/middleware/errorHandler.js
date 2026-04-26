
// Purpose: Centralized error handling.
// Instead of try/catch in every route, errors bubble up here.

const errorHandler = (err, req, res, next) => {
  // Default to 500 if no status was set
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    error: err.message,
    // Show stack trace only in development (security: don't leak internals in prod)
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;