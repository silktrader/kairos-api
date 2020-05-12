import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// https://docs.nestjs.com/custom-decorators
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
