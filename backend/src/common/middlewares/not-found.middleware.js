import { NotFoundError } from '../errors/index.js';

export const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} does not exist on this server`));
};
