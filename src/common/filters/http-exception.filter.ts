import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const isProd = process.env.NODE_ENV === 'production';

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'object' && body !== null && 'message' in body
          ? (body as { message: string | string[] }).message
          : exception.message;
      const payload = {
        statusCode: status,
        message: Array.isArray(message) ? message : [message],
        error: exception.name,
      };
      if (!isProd && status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(`${req.method} ${req.url}`, exception);
      }
      res.status(status).json(payload);
      return;
    }

    this.logger.error(`${req.method} ${req.url}`, exception);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: ['Internal server error'],
      error: 'InternalServerError',
    });
  }
}
