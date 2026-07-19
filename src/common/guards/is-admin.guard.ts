import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

interface UserRequest extends Request {
  user?: { role?: string };
}

@Injectable()
export class IsAdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<UserRequest>();

    const userRole = request?.user?.role;

    return userRole === 'admin';
  }
}
