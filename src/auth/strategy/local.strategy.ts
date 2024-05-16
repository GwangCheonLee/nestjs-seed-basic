import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { GuardEnum } from '../enum/guard.enum';
import { UserRepository } from '../../users/repositories/user.repository';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, GuardEnum.LOCAL) {
  constructor(private readonly userRepository: UserRepository) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<User> {
    return await this.userRepository.verifyUserCredentials(email, password);
  }
}
