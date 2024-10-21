/**
 * User AccessToken에서 사용되는 키 값을 생성하는 함수입니다.
 * @param {number} userId - 토큰을 생성할 유저
 * @return {string} - 완성된 Redis 키
 */
export const userAccessTokenKey: (userId: number) => string = (
  userId: number,
): string => {
  return `user:${userId}:hashedAccessToken`;
};

/**
 * User RefreshToken에서 사용되는 키 값을 생성하는 함수입니다.
 * @param {number} userId - 토큰을 생성할 유저
 * @return {string} - 완성된 Redis 키
 */
export const userRefreshTokenKey: (userId: number) => string = (
  userId: number,
): string => {
  return `user:${userId}:hashedRefreshToken`;
};
