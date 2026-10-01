import { HttpStatus } from '../constants/http-status.constant.js';

export class AppError extends Error {
  constructor(
    message,
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    errors = null,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}
