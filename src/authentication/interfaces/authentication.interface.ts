import {UserWithoutPassword} from '../../users/interfaces/user.interface';

/**
 * Represents the structure of the response when a user signs in.
 */
export interface SignInResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Represents the structure of the response when a user signs up.
 * This is likely the same as AuthenticatedUser but is separated for clarity and possible future changes.
 */
export type SignUpResponse = UserWithoutPassword;
