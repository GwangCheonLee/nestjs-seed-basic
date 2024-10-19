import {Injectable} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {GuardEnum} from '../enum/guard.enum';

@Injectable()
export class JwtRefreshGuard extends AuthGuard(GuardEnum.JWT_REFRESH) {}
