import {User} from '../entities/user.entity';
import {UserWithoutPassword} from '../types/user.type';
import {extractPayloadFromUser} from './user.constant';

describe('extractPayloadFromUser', () => {
  it('should return a user object without the password field', () => {
    const user: User = {
      id: 1,
      nickname: 'testUser',
      email: 'test@example.com',
      password: 'secretPassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Partial<User> as User;

    const expectedUser: UserWithoutPassword = {
      id: 1,
      nickname: 'testUser',
      email: 'test@example.com',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } as Partial<User> as UserWithoutPassword;

    const result = extractPayloadFromUser(user);
    expect(result).toEqual(expectedUser);
    expect(result).not.toHaveProperty('password');
  });
});
