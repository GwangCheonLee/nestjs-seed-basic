import {SetMetadata} from '@nestjs/common';
import {UserRole} from '../../users/enum/user-role.enum';

export const USER_ROLES_KEY = 'roles';

/**
 * Decorator to set user roles for a route
 */
export const UserRoles = (...roles: UserRole[]) =>
  SetMetadata(USER_ROLES_KEY, roles);
