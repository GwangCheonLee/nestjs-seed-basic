/**
 * Represents the structure of a User as part of the authentication process.
 */
export interface AuthenticatedUser {
  id: number;
  email: string;
  nickname: string;
}

/**
 * Represents the structure of the response when a user signs in.
 */
export interface SignInResponse {
  accessToken: string;
}

/**
 * Represents the structure of the response when a user signs up.
 * This is likely the same as AuthenticatedUser but is separated for clarity and possible future changes.
 */
export type SignUpResponse = AuthenticatedUser;
