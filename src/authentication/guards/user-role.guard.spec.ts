import {ExecutionContext} from '@nestjs/common';
import UserRoleGuard from './user-role.guard';
import {UserRole} from '../../users/enum/user-role.enum';
import {User} from '../../users/entities/user.entity';
import RequestWithUser from '../../common/interfaces/request-with-user.interface';

describe('UserRoleGuard', () => {
  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    roles: [UserRole.USER],
  } as User;

  const createMockExecutionContext = (user: User | null): ExecutionContext => {
    const mockRequest: Partial<RequestWithUser> = {user};
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;
  };

  it('should allow access if user has the required role', () => {
    const roles = [UserRole.USER];
    const guard = UserRoleGuard(roles);
    const context = createMockExecutionContext(mockUser);

    const result = new guard().canActivate(context);
    expect(result).toBe(true);
  });

  it('should deny access if user does not have the required role', () => {
    const roles = [UserRole.ADMIN];
    const guard = UserRoleGuard(roles);
    const context = createMockExecutionContext(mockUser);

    const result = new guard().canActivate(context);
    expect(result).toBe(false);
  });

  it('should deny access if user is not logged in', () => {
    const roles = [UserRole.USER];
    const guard = UserRoleGuard(roles);
    const context = createMockExecutionContext(null);

    const result = new guard().canActivate(context);
    expect(result).toBe(false);
  });

  it('should allow access if user has one of multiple required roles', () => {
    const roles = [UserRole.ADMIN, UserRole.USER];
    const guard = UserRoleGuard(roles);
    const context = createMockExecutionContext(mockUser);

    const result = new guard().canActivate(context);
    expect(result).toBe(true);
  });
});
