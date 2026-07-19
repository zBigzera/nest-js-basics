import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class AddHeaderInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> | Promise<Observable<any>> {
    const response = context.switchToHttp().getResponse<Response>();

    response.setHeader('X-Custom-Header', 'Api NestJs by Otávio Bigogno');

    return next.handle();
  }
}
