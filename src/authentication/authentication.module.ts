import {Module} from '@nestjs/common';
import {AuthenticationService} from './authentication.service';
import {AuthenticationController} from './authentication.controller';
import {LocalStrategy} from './strategy/local.strategy';
import {UserRepository} from '../users/repositories/user.repository';
import {JwtModule} from '@nestjs/jwt';
import {JwtAccessStrategy} from './strategy/jwt-access.strategy';

@Module({
  imports: [JwtModule],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    LocalStrategy,
    JwtAccessStrategy,
    UserRepository,
  ],
})
export class AuthenticationModule {}
