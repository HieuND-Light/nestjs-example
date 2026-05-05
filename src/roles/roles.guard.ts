import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    // const user = request.user;
    const raw = request.headers['x-roles'];

    let userRoles: string[] = [];
    if (typeof raw === 'string') {
      userRoles = raw.split(',').map((role) => role.trim());
    } else if (Array.isArray(raw)) {
      userRoles = raw;
    }
    const hasRole = roles.some((role) => userRoles?.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `You do not have the required roles: ${roles.join(', ')}`,
      );
    }

    return true;
  }
}

// function matchRoles(roles: string[], userRoles: string[]): boolean {
//   return roles.some((role) => userRoles?.includes(role));
// }
