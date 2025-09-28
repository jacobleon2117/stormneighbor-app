const securityMiddleware = require("./security");
const { logSecurityEvent } = require("../services/SecurityEventService");
const logger = require("../utils/logger");

const createErrorResponse = (message, code, error = null, data = null, success = false) => {
  const response = {
    success,
    message,
    code,
    timestamp: new Date().toISOString(),
  };

  if (data) response.data = data;

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

  return res.status(statusCode).json(createErrorResponse(message, "DATABASE_ERROR", error.message));
};

const handleValidationError = (errors, res) => {
  return res.status(400).json(
    createErrorResponse("Validation failed", "VALIDATION_ERROR", null, {
      errors: errors?.array ? errors.array() : errors,
    })
  );
};

const handleAuthError = (res, message = "Authentication required") => {
  return res.status(401).json(createErrorResponse(message, "AUTH_ERROR"));
};

const handleAuthorizationError = (res, message = "Access denied") => {
  return res.status(403).json(createErrorResponse(message, "AUTHORIZATION_ERROR"));
};

const handleNotFoundError = (res, resource = "Resource") => {
  return res.status(404).json(createErrorResponse(`${resource} not found`, "NOT_FOUND"));
};

const handleRateLimitError = (res, message = "Too many requests") => {
  return res.status(429).json(createErrorResponse(message, "RATE_LIMIT_EXCEEDED"));
};

const handleServerError = (error, req, res, operation = "operation") => {
  logger.error(`Server error during ${operation}:`, {
    error: error.message,
    stack: error.stack,
    url: req.url,
    requestId: req.requestId,
  });

  return res
    .status(500)
    .json(
      createErrorResponse(
        `Server error during ${operation}`,
        "SERVER_ERROR",
        process.env.NODE_ENV === "development" ? error.message : undefined
      )
    );
};

const globalErrorHandler = async (err, req, res, _next) => {
  logger.error("Global error handler:", {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    requestId: req.requestId,
  });

  if (err.message?.includes("Invalid JSON") || err.type === "entity.parse.failed") {
    try {
      await logSecurityEvent(req.user?.userId || null, "MALFORMED_REQUEST", {
        error: err.message,
        type: err.type,
        url: req.url,
        method: req.method,
      });
    } catch (logError) {
      logger.warn("Failed to log security event:", logError);
    }
    return res.status(400).json(createErrorResponse("Invalid request format", "INVALID_REQUEST"));
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json(createErrorResponse("Request too large", "REQUEST_TOO_LARGE"));
  }

  return handleServerError(err, req, res, "request processing");
};

const createSuccessResponse = (message, data = null, meta = null) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== null) response.data = data;
  if (meta) response.meta = meta;

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
