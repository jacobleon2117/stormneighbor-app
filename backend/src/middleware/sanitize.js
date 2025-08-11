// File: backend/src/middleware/sanitize.js
const createDOMPurify = require("isomorphic-dompurify");
const { JSDOM } = require("jsdom");
const path = require("path");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

const sanitizeInput = (req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === "object") {
      req.query = sanitizeObject(req.query);
    }
    if (req.params && typeof req.params === "object") {
      req.params = sanitizeObject(req.params);
    }
    next();
  } catch (error) {
    console.error("Input sanitization error:", error);
    next();
  }
};

const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => sanitizeObject(item));
  if (typeof obj === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  if (typeof obj === "string") {
    return DOMPurify.sanitize(obj, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    })
      .replace(/[\x00-\x1F\x7F]/g, "")
      .trim();
  }
  return obj;
};

const sanitizeSensitive = (req, res, next) => {
  try {
    const sensitiveFields = ["password", "currentPassword", "newPassword"];
    if (req.body && typeof req.body === "object") {
      sensitiveFields.forEach((field) => {
        if (req.body[field] && typeof req.body[field] === "string") {
          req.body[field] = req.body[field].replace(/[\x00-\x1F\x7F<>"'&]/g, "").trim();
        }
      });
    }
    next();
  } catch (error) {
    console.error("Sensitive field sanitization error:", error);
    next();
  }
};

const sanitizeFileMetadata = (req, res, next) => {
  try {
    const cleanFilename = (name) => {
      let sanitized = DOMPurify.sanitize(name, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      sanitized = Array.from(sanitized)
        .filter((char) => {
          const code = char.charCodeAt(0);
          return code >= 32 && code !== 127;
        })
        .join("");

      return path.basename(sanitized);
    };

    if (req.file?.originalname) {
      req.file.originalname = cleanFilename(req.file.originalname);
    }
    if (Array.isArray(req.files)) {
      req.files.forEach((file) => {
        if (file.originalname) {
          file.originalname = cleanFilename(file.originalname);
        }
      });
    }

    next();
  } catch (error) {
    console.error("File metadata sanitization error:", error);
    next();
  }
};

module.exports = {
  sanitizeInput,
  sanitizeSensitive,
  sanitizeFileMetadata,
};
