/**
 * NoSQL Injection Protection Middleware
 *
 * Recursively inspects and sanitizes request payloads (req.body, req.query, req.params).
 * Strips any object key that begins with '$' or contains '.' to prevent MongoDB operator injection attacks.
 */

export function sanitizeNoSqlObject(payload) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if (Array.isArray(payload)) {
    for (let i = 0; i < payload.length; i++) {
      payload[i] = sanitizeNoSqlObject(payload[i]);
    }
    return payload;
  }

  for (const key of Object.keys(payload)) {
    // MongoDB operators begin with '$' or contain '.' (e.g. $gt, $ne, $where, field.subfield)
    if (key.startsWith('$') || key.includes('.')) {
      delete payload[key];
    } else if (typeof payload[key] === 'object' && payload[key] !== null) {
      sanitizeNoSqlObject(payload[key]);
    }
  }

  return payload;
}

export const nosqlSanitizer = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeNoSqlObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeNoSqlObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizeNoSqlObject(req.params);
  }
  next();
};
