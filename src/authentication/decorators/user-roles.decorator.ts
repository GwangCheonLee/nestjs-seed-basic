import {CustomDecorator, SetMetadata} from '@nestjs/common';
import {UserRole} from '../../users/enum/user-role.enum';

export const USER_ROLES_KEY = 'roles';

/**
 * Decorator to set user roles for a route
 * @param {UserRole[]} roles - User roles
 * @return {CustomDecorator<string>} - Custom decorator
 */
export const UserRoles = (...roles: UserRole[]): CustomDecorator<string> =>
  SetMetadata(USER_ROLES_KEY, roles);
