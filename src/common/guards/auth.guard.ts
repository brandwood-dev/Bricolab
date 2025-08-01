import { AuthGuard } from '@nestjs/passport';
import {
  ExecutionContext,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header found');
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const [type, token] = parts;

    if (type !== 'Bearer') {
      throw new UnauthorizedException(
        'Authorization header must be Bearer token',
      );
    }

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = User>(err: unknown, user: TUser): TUser {
    if (err || !user) {
      if (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unknown error occurred';

        console.error('JWT Authentication Error:', errorMessage);
      }
      throw new UnauthorizedException(
        err instanceof Error
          ? err.message
          : 'Invalid or expired authorization token',
      );
    }
    return user;
  }
}