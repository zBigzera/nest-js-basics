import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { jwtPayload } from '../guards/auth-token.guard';

export const User = createParamDecorator(
  (data: keyof jwtPayload, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: jwtPayload }>();

    if (request.user) {
      return data ? request.user[data] : request.user;
    }

    return undefined;
  },
);
