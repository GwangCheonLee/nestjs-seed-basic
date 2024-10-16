import {createParamDecorator, ExecutionContext} from '@nestjs/common';

/**
 * Custom decorator to fetch the user from the request
 */
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
