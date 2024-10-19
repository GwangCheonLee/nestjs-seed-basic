import {AuthenticatedUser} from './authentication.interface';

export interface JwtPayloadInterface {
  user: AuthenticatedUser;
  iat: number;
  exp: number;
}
