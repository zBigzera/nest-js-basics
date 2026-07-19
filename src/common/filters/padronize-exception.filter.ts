import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  message?: string[] | string;
  error?: string;
  statusCode?: number;
}

@Catch()
export class PadronizeExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let message: string = 'Erro interno do servidor';
    let status: number = 500;
    let errors: string[] | undefined = undefined;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      status = exception.getStatus();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const data = exceptionResponse as ErrorResponse;
        if (Array.isArray(data.message)) {
          message = 'Erro de validação';
          errors = data.message;
        } else {
          message = data?.message ?? message;
        }
      }
    }

    res.status(status).json({
      success: false,
      status: status,
      message: message,
      errors: errors,
      path: req.path,
      timestamp: new Date().toISOString(),
    });
  }
}
