import { AuthenticatedUser } from '../../auth/interfaces/auth.interface';

export interface JwtPayloadInterface {
  user: AuthenticatedUser;
  iat: number;
  exp: number;
}
