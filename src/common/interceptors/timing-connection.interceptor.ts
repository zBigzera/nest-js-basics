import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class TimingConnectionInterceptor implements NestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const startTime = Date.now();

    await new Promise((resolve) => setTimeout(resolve, 3000));
    return next.handle().pipe(
      tap(() => {
        const finalTime = Date.now();

        const ellapsedTime = finalTime - startTime;

        console.warn(
          `Timing interceptor ellapsed ${ellapsedTime}/ms in class ${context.getClass().name}.${context.getHandler().name}`,
        );
      }),
    );
  }
}
