import { AppError } from '../errors/app.error.js';
import { ApiResponse } from '../utils/api-response.js';
import { HttpStatus } from '../constants/http-status.constant.js';
import { logger } from '../../config/logger.config.js';
import { env } from '../../config/env.config.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Convert Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new AppError(message, HttpStatus.BAD_REQUEST);
  }

  // Convert Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    const message = `Duplicate value entered for ${fields}. Please use unique values.`;
    error = new AppError(message, HttpStatus.CONFLICT);
  }

  // Convert Mongoose Validation Error
  if (err.name === 'ValidationError' && !(err instanceof AppError)) {
    const errors = Object.values(err.errors || {}).map((el) => ({
      field: el.path,
      message: el.message,
    }));
    error = new AppError('Database validation failed', HttpStatus.UNPROCESSABLE_ENTITY, errors);
  }

  // Handle Payload Too Large (Express body-parser 413)
  if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413) {
    error = new AppError(
      'Request payload exceeds maximum allowed size (limit: 200KB)',
      HttpStatus.PAYLOAD_TOO_LARGE
    );
  }

  // Handle malformed JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError('Malformed JSON payload received', HttpStatus.BAD_REQUEST);
  }

  // Convert JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError(
      'Invalid authentication token. Please sign in again.',
      HttpStatus.UNAUTHORIZED
    );
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError(
      'Authentication token has expired. Please sign in again.',
      HttpStatus.UNAUTHORIZED
    );
  }

  const statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
  const message = error.isOperational ? error.message : 'Internal Server Error';

  // Log unexpected errors
  if (!error.isOperational) {
    logger.error(
      {
        err: {
          message: err.message,
          stack: err.stack,
          name: err.name,
        },
        path: req.originalUrl,
        method: req.method,
      },
      'Unhandled Server Exception'
    );
  } else {
    logger.warn(
      {
        path: req.originalUrl,
        method: req.method,
        statusCode,
        message: error.message,
      },
      'Operational Error Handled'
    );
  }

  const errorDetails = error.errors || null;

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(errorDetails && { errors: errorDetails }),
    ...(env.NODE_ENV === 'development' && !error.isOperational && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};
