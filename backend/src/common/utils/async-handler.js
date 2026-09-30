/**
 * Wraps an async express route handler to forward unhandled promise rejections to next()
 * @param {Function} fn
 * @returns {Function}
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
