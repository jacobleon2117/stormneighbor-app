const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

const buildErrorResponse = (errors, message = "Validation failed") => ({
  success: false,
  message,
  errors,
  errorCount: errors.length,
});

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    if (process.env.NODE_ENV === "development") {
      logger.info("Validation errors:", formattedErrors);
    }

    return res.status(400).json(buildErrorResponse(formattedErrors));
  }

  next();
};

const validateRequiredFields = (fields) => (req, res, next) => {
  const errors = [];

  fields.forEach((field) => {
    const value = req.body?.[field];
    if (value === null) {
      errors.push({ field, message: `${field} is required`, value: null, location: "body" });
    } else if (typeof value === "string" && value.trim() === "") {
      errors.push({ field, message: `${field} cannot be empty`, value, location: "body" });
    }
  });

  if (errors.length > 0)
    return res.status(400).json(buildErrorResponse(errors, "Required fields missing or empty"));

  next();
};

const validateAuthToken = (req, res, next) => {
  const token = req.header("Authorization")?.trim();

  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json(
      buildErrorResponse(
        [
          {
            field: "authorization",
            message: "Bearer token required in Authorization header",
            location: "header",
          },
        ],
        "Access denied. Valid token required."
      )
    );
  }

  next();
};

const validateFileUpload = (options = {}) => {
  const {
    required = true,
    maxSize = 10 * 1024 * 1024,
    allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  } = options;

  return (req, res, next) => {
    const file = req.file;

    if (required && !file) {
      return res.status(400).json(
        buildErrorResponse(
          [
            {
              field: "file",
              message: "No file uploaded",
              location: "file",
            },
          ],
          "File upload required"
        )
      );
    }

    if (file) {
      if (file.size > maxSize) {
        return res.status(400).json(
          buildErrorResponse(
            [
              {
                field: "file",
                message: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
                value: `${Math.round(file.size / 1024 / 1024)}MB`,
                location: "file",
              },
            ],
            "File too large"
          )
        );
      }

      if (!new Set(allowedTypes).has(file.mimetype)) {
        return res.status(400).json(
          buildErrorResponse(
            [
              {
                field: "file",
                message: `File type must be one of: ${allowedTypes.join(", ")}`,
                value: file.mimetype,
                location: "file",
              },
            ],
            "Invalid file type"
          )
        );
      }
    }

    next();
  };
};

const validateCoordinates = (req, res, next) => {
  const { latitude, longitude } = req.body;
  const errors = [];

  if (latitude !== null) {
    const lat = parseFloat(latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push({
        field: "latitude",
        message: "Latitude must be a number between -90 and 90",
        value: latitude,
        location: "body",
      });
    }
  }

  if (longitude !== null) {
    const lng = parseFloat(longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push({
        field: "longitude",
        message: "Longitude must be a number between -180 and 180",
        value: longitude,
        location: "body",
      });
    }
  }

  if (errors.length > 0)
    return res.status(400).json(buildErrorResponse(errors, "Invalid coordinates"));

  next();
};

const validatePagination = (req, res, next) => {
  const errors = [];
  const { limit, offset } = req.query;

  if (limit !== null) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({
        field: "limit",
        message: "Limit must be a number between 1 and 100",
        value: limit,
        location: "query",
      });
    }
  }

  if (offset !== null) {
    const offsetNum = parseInt(offset);
    if (isNaN(offsetNum) || offsetNum < 0) {
      errors.push({
        field: "offset",
        message: "Offset must be a non-negative number",
        value: offset,
        location: "query",
      });
    }
  }

  if (errors.length > 0)
    return res.status(400).json(buildErrorResponse(errors, "Invalid pagination parameters"));

  next();
};

const validateIdParam =
  (paramName = "id") =>
  (req, res, next) => {
    const id = req.params?.[paramName];
    const idNum = parseInt(id);

    if (!id || isNaN(idNum) || idNum < 1) {
      return res.status(400).json(
        buildErrorResponse(
          [
            {
              field: paramName,
              message: `${paramName} must be a positive integer`,
              value: id,
              location: "params",
            },
          ],
          "Invalid ID parameter"
        )
      );
    }

    req.params[`${paramName}Num`] = idNum;
    next();
  };

module.exports = {
  handleValidationErrors,
  validateRequiredFields,
  validateAuthToken,
  validateFileUpload,
  validateCoordinates,
  validatePagination,
  validateIdParam,
};
