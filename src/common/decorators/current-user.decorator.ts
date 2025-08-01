import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<Request & {user?: any}>();
        if(!request.user) {
            return null;
        }

        return data ? request.user[data] : request.user;
    }
)