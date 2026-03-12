import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorResponse } from '@common/interfaces/api-response.interface';

/**
 * Raw exception response từ NestJS/Zod
 */
interface ExceptionBody {
  success?: boolean;
  message?: string | string[];
  error?: string;
  errors?: Record<string, unknown>;
}

/**
 * Catch tất cả HttpException (400, 401, 403, 404, 409...)
 *
 * Response format:
 * {
 *   "success": false,
 *   "message": "Error message",
 *   "errors": { ... }     // optional - chỉ khi validation failed
 * }
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as string | ExceptionBody;

    let message: string;
    let errors: Record<string, unknown> | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else {
      message = Array.isArray(exceptionResponse.message)
        ? exceptionResponse.message.join(', ')
        : exceptionResponse.message || exception.message;

      // Giữ lại validation errors nếu có (từ ZodValidationPipe)
      errors = exceptionResponse.errors;
    }

    this.logger.warn(`[${status}] ${message}`);

    const body: ApiErrorResponse = {
      success: false,
      message,
      ...(errors && { errors }),
    };

    response.status(status).json(body);
  }
}

/**
 * Catch tất cả unhandled exceptions (500)
 * Log error gốc để debug, nhưng không expose ra client
 *
 * Response format:
 * {
 *   "success": false,
 *   "message": "Internal server error"
 * }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Log error gốc để debug — KHÔNG nuốt lỗi
    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    const body: ApiErrorResponse = {
      success: false,
      message: 'Internal server error',
    };

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
