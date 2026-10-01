import { HttpStatus } from '../constants/http-status.constant.js';

export class ApiResponse {
  /**
   * Format a successful response
   */
  static success(res, data = null, message = 'Success', statusCode = HttpStatus.OK, meta = null) {
    const payload = {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    if (meta) {
      payload.meta = meta;
    }

    return res.status(statusCode).json(payload);
  }

  /**
   * Format a created response (201)
   */
  static created(res, data = null, message = 'Resource created successfully', meta = null) {
    return ApiResponse.success(res, data, message, HttpStatus.CREATED, meta);
  }

  /**
   * Format an error response
   */
  static error(
    res,
    message = 'Internal Server Error',
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    errors = null
  ) {
    const payload = {
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errors) {
      payload.errors = errors;
    }

    return res.status(statusCode).json(payload);
  }
}
