const securityMiddleware = require("./security");
const logger = require("../utils/logger");

const createErrorResponse = (success = false, message, code, error = null, data = null) => {
  const response = {
    success,
    message,
    code,
    timestamp: new Date().toISOString(),
  };

  if (data) {
    response.data = data;
  }

  if (error && process.env.NODE_ENV === "development") {
    response.error = error;
  }

  return response;
};

const handleDatabaseError = (error, req, res, operation = "database operation") => {
  logger.error(`Database error during ${operation}:`, error);

  if (error.message.includes("invalid input syntax") || error.code === "22P02") {
    securityMiddleware.logSecurityEvent(req, "INVALID_INPUT", {
      operation,
      error: error.message,
    });
  }

  const statusCode = error.code === "23505" ? 409 : 500;
  const message =
    error.code === "23505" ? "Resource already exists" : `Server error during ${operation}`;

  return res
    .status(statusCode)
    .json(createErrorResponse(false, message, "DATABASE_ERROR", error.message));
};

const handleValidationError = (errors, res) => {
  return res
    .status(400)
    .json(
      createErrorResponse(false, "Validation failed", "VALIDATION_ERROR", null, {
        errors: errors.array(),
      })
    );
};

const handleAuthError = (res, message = "Authentication required") => {
  return res.status(401).json(createErrorResponse(false, message, "AUTH_ERROR"));
};

const handleAuthorizationError = (res, message = "Access denied") => {
  return res.status(403).json(createErrorResponse(false, message, "AUTHORIZATION_ERROR"));
};

const handleNotFoundError = (res, resource = "Resource") => {
  return res.status(404).json(createErrorResponse(false, `${resource} not found`, "NOT_FOUND"));
};

const handleRateLimitError = (res, message = "Too many requests") => {
  return res.status(429).json(createErrorResponse(false, message, "RATE_LIMIT_EXCEEDED"));
};

const handleServerError = (error, _req, res, operation = "operation") => {
  logger.error(`Server error during ${operation}:`, error);

  return res
    .status(500)
    .json(
      createErrorResponse(
        false,
        `Server error during ${operation}`,
        "SERVER_ERROR",
        process.env.NODE_ENV === "development" ? error.message : undefined
      )
    );
};

const globalErrorHandler = (err, req, res, _next) => {
  console.error("Global error handler:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    requestId: req.requestId,
  });

  if (err.message.includes("Invalid JSON") || err.type === "entity.parse.failed") {
    securityMiddleware.logSecurityEvent(req, "MALFORMED_REQUEST", {
      error: err.message,
      type: err.type,
    });
    return res
      .status(400)
      .json(createErrorResponse(false, "Invalid request format", "INVALID_REQUEST"));
  }

  if (err.type === "entity.too.large") {
    return res
      .status(413)
      .json(createErrorResponse(false, "Request too large", "REQUEST_TOO_LARGE"));
  }

  return handleServerError(err, req, res, "request processing");
};

const createSuccessResponse = (message, data = null, meta = null) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta) {
    response.meta = meta;
  }

  return response;
};

module.exports = {
  createErrorResponse,
  createSuccessResponse,
  handleDatabaseError,
  handleValidationError,
  handleAuthError,
  handleAuthorizationError,
  handleNotFoundError,
  handleRateLimitError,
  handleServerError,
  globalErrorHandler,
};
