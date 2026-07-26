import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROUTE_POLICY_KEY } from '../decorator/RoutePolicy.decorator';
import { RoutePolicies } from '../enum/route-policies.enum';
import { jwtPayload } from './auth-token.guard';

@Injectable()
export class RoutePolicyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const routePolicyRequired = this.reflector.get<RoutePolicies | undefined>(
      ROUTE_POLICY_KEY,
      context.getHandler(),
    );

    if (!routePolicyRequired) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user: jwtPayload }>();

    if (!user) {
      throw new UnauthorizedException(
        'Você não tem permissão para acessar este recurso',
      );
    }

    if (!user.policies.includes(routePolicyRequired)) {
      throw new UnauthorizedException(
        'Você não tem permissão para acessar este recurso',
      );
    }

    return true;
  }
}
