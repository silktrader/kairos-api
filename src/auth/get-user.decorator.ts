import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from './user.entity';

// https://docs.nestjs.com/custom-decorators
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as User;
  },
);
