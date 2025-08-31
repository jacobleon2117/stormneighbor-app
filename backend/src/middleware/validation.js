const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

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

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
      errorCount: formattedErrors.length,
    });
  }

  next();
};

const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missing = [];
    const empty = [];

    fields.forEach((field) => {
      const value = req.body[field];

      if (value === undefined || value === null) {
        missing.push(field);
      } else if (typeof value === "string" && value.trim() === "") {
        empty.push(field);
      }
    });

    if (missing.length > 0 || empty.length > 0) {
      const errors = [];

      missing.forEach((field) => {
        errors.push({
          field,
          message: `${field} is required`,
          value: null,
          location: "body",
        });
      });

      empty.forEach((field) => {
        errors.push({
          field,
          message: `${field} cannot be empty`,
          value: req.body[field],
          location: "body",
        });
      });

      return res.status(400).json({
        success: false,
        message: "Required fields missing or empty",
        errors,
        errorCount: errors.length,
      });
    }

    next();
  };
};

const validateAuthToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Valid token required.",
      errors: [
        {
          field: "authorization",
          message: "Bearer token required in Authorization header",
          location: "header",
        },
      ],
    });
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
    if (required && !req.file) {
      return res.status(400).json({
        success: false,
        message: "File upload required",
        errors: [
          {
            field: "file",
            message: "No file uploaded",
            location: "file",
          },
        ],
      });
    }

    if (req.file) {
      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: "File too large",
          errors: [
            {
              field: "file",
              message: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
              value: `${Math.round(req.file.size / 1024 / 1024)}MB`,
              location: "file",
            },
          ],
        });
      }

      const allowedTypesSet = new Set(allowedTypes);
      if (!allowedTypesSet.has(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Invalid file type",
          errors: [
            {
              field: "file",
              message: `File type must be one of: ${allowedTypes.join(", ")}`,
              value: req.file.mimetype,
              location: "file",
            },
          ],
        });
      }
    }

    next();
  };
};

const validateCoordinates = (req, res, next) => {
  const { latitude, longitude } = req.body;

  const errors = [];

  if (latitude !== undefined && latitude !== null) {
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

  if (longitude !== undefined && longitude !== null) {
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

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid coordinates",
      errors,
      errorCount: errors.length,
    });
  }

  next();
};

const validatePagination = (req, res, next) => {
  const { limit, offset } = req.query;
  const errors = [];

  if (limit !== undefined) {
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

  if (offset !== undefined) {
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

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid pagination parameters",
      errors,
      errorCount: errors.length,
    });
  }

  next();
};

const validateIdParam = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const idNum = parseInt(id);

    if (!id || isNaN(idNum) || idNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID parameter",
        errors: [
          {
            field: paramName,
            message: `${paramName} must be a positive integer`,
            value: id,
            location: "params",
          },
        ],
      });
    }

    req.params[`${paramName}Num`] = idNum;
    next();
  };
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
