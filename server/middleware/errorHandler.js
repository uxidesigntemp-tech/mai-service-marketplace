// server/middleware/errorHandler.js

function errorHandler(err, req, res, next) {
  console.error(`[SERVER ERROR] ${req.method} ${req.url}:`, err);

  const statusCode = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred. Please try again.',
    ...(isProduction ? {} : { stack: err.stack })
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'NotFound',
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
