import {Injectable} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {GuardEnum} from '../enum/guard.enum';

@Injectable()
export class JwtAccessGuard extends AuthGuard(GuardEnum.JWT_ACCESS) {}
