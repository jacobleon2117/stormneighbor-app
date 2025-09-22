const createDOMPurify = require("isomorphic-dompurify");
const { JSDOM } = require("jsdom");
const path = require("path");
const logger = require("../utils/logger");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

const sanitizeObject = (obj) => {
  if (obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  if (typeof obj === "object") {
    for (const key in obj) {
      obj[key] = sanitizeObject(obj[key]);
    }
    return obj;
  }

  if (typeof obj === "string") {
    const sanitized = DOMPurify.sanitize(obj, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
      .replace(/\p{Cc}/gu, "")
      .trim();

    return sanitized;
  }

  return obj;
};

const sanitizeInput = (req, _res, next) => {
  try {
    if (req.body && typeof req.body === "object") req.body = sanitizeObject(req.body);
    if (req.query && typeof req.query === "object") req.query = sanitizeObject(req.query);
    if (req.params && typeof req.params === "object") req.params = sanitizeObject(req.params);
    next();
  } catch (error) {
    logger.error("Input sanitization error:", error);
    next(error);
  }
};

const sanitizeSensitive = (req, _res, next) => {
  try {
    const sensitiveFields = ["password", "currentPassword", "newPassword"];
    if (req.body && typeof req.body === "object") {
      sensitiveFields.forEach((field) => {
        if (typeof req.body[field] === "string") {
          const str = req.body[field];
          req.body[field] = Array.from(str)
            .filter((char) => {
              const code = char.charCodeAt(0);
              return code >= 32 && code !== 127 && !/["<>'&]/.test(char);
            })
            .join("")
            .trim();
        }
      });
    }
    next();
  } catch (error) {
    logger.error("Sensitive field sanitization error:", error);
    next(error);
  }
};

const sanitizeFileMetadata = (req, _res, next) => {
  try {
    const cleanFilename = (name) => {
      if (!name) return "";
      let sanitized = DOMPurify.sanitize(name, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
        .replace(/\p{Cc}/gu, "")
        .trim();

      sanitized = sanitized.replace(/[<>:"/\\|?*\s]+/g, "_");
      return path.basename(sanitized);
    };

    if (req.file?.originalname) req.file.originalname = cleanFilename(req.file.originalname);
    if (Array.isArray(req.files)) {
      req.files.forEach((file) => {
        if (file.originalname) file.originalname = cleanFilename(file.originalname);
      });
    }

    next();
  } catch (error) {
    logger.error("File metadata sanitization error:", error);
    next(error);
  }
};

module.exports = {
  sanitizeInput,
  sanitizeSensitive,
  sanitizeFileMetadata,
};
