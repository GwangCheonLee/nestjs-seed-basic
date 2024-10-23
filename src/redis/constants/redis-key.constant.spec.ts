import {userAccessTokenKey, userRefreshTokenKey} from './redis-key.constant';

describe('Redis key generation functions', () => {
  const userId = 123;

  describe('userAccessTokenKey', () => {
    it('should return the correct Redis key for accessToken', () => {
      const expectedKey = `user:${userId}:hashedAccessToken`;
      const result = userAccessTokenKey(userId);
      expect(result).toBe(expectedKey);
    });
  });

  describe('userRefreshTokenKey', () => {
    it('should return the correct Redis key for refreshToken', () => {
      const expectedKey = `user:${userId}:hashedRefreshToken`;
      const result = userRefreshTokenKey(userId);
      expect(result).toBe(expectedKey);
    });
  });
});
