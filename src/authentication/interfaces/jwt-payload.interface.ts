import {UserWithoutPassword} from '../../users/interfaces/user.interface';
import {UserRole} from '../../users/enum/user-role.enum';

/**
 * JWT 페이로드 인터페이스입니다.
 */
export interface JwtPayloadInterface {
  user: UserWithoutPassword;
  roles: UserRole[];
  iat: number;
  exp: number;
  sub: number;
  aud: string;
  iss: string;
}
