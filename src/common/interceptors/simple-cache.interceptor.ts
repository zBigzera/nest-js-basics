import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, of, tap } from 'rxjs';

type cached<T> = {
  item: T;
  expiresAt: number;
};

@Injectable()
export class SimpleCacheInterceptor implements NestInterceptor {
  private readonly cache = new Map<string, cached<unknown>>();
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const url = request.url;

    const itemCached = this.cache.get(url);

    if (itemCached && Date.now() < itemCached.expiresAt) {
      console.log('Retornado do cache');

      return of(itemCached.item);
    }

    return next.handle().pipe(
      tap((data) => {
        this.cache.set(url, {
          item: data,
          expiresAt: Date.now() + 10000,
        });

        console.log('Armazenado no cache');
      }),
    );
  }
}
