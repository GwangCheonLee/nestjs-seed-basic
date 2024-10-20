import {ExtractJwt, Strategy} from 'passport-jwt';
import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {ConfigService} from '@nestjs/config';
import {GuardEnum} from '../enum/guard.enum';
import {UserRepository} from '../../users/repositories/user.repository';
import {JwtPayloadInterface} from '../interfaces/jwt-payload.interface';
import {User} from '../../users/entities/user.entity';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  GuardEnum.JWT_REFRESH,
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_REFRESH_TOKEN_SECRET'),
    });
  }

  async validate(payload: JwtPayloadInterface): Promise<User> {
    return await this.userRepository.findUserById(payload.user.id);
  }
}