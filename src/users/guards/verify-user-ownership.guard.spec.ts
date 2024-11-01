import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import {VerifyUserOwnershipGuard} from './verify-user-ownership.guard';
import {User} from '../entities/user.entity';
import {UserRole} from '../enum/user-role.enum';

describe('VerifyUserOwnershipGuard', () => {
  let guard: VerifyUserOwnershipGuard;

  const mockContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn(),
    }),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VerifyUserOwnershipGuard],
    }).compile();

    guard = module.get<VerifyUserOwnershipGuard>(VerifyUserOwnershipGuard);
  });

  it('should allow access if user is an admin', async () => {
    const adminUser: User = {id: 2, roles: [UserRole.ADMIN]} as User;
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: adminUser,
      params: {id: '1'},
    });

    await expect(guard.canActivate(mockContext)).resolves.toBe(true);
  });

  it('should allow access if user accesses their own data', async () => {
    const regularUser: User = {id: 1, roles: [UserRole.USER]} as User;
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: regularUser,
      params: {id: '1'},
    });

    await expect(guard.canActivate(mockContext)).resolves.toBe(true);
  });

  it('should deny access if user is not an admin and tries to access another user’s data', async () => {
    const regularUser: User = {id: 1, roles: [UserRole.USER]} as User;
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: regularUser,
      params: {id: '2'},
    });

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw BadRequestException if user ID is missing from route params', async () => {
    const user: User = {id: 1, roles: [UserRole.USER]} as User;
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      user: user,
      params: {},
    });

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      BadRequestException,
    );
  });
});
