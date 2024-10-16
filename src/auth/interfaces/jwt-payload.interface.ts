import {AuthenticatedUser} from './auth.interface';

export interface JwtPayloadInterface {
  user: AuthenticatedUser;
  iat: number;
  exp: number;
}
