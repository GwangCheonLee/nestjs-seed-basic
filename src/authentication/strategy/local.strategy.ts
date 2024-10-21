import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-local';
import {GuardEnum} from '../enum/guard.enum';
import {UserRepository} from '../../users/repositories/user.repository';
import {User} from '../../users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, GuardEnum.LOCAL) {
  constructor(private readonly userRepository: UserRepository) {
    super({usernameField: 'email'});
  }

  /**
   * 로컬 전략으로 유저 자격 증명을 검증하는 메서드입니다.
   *
   * @param {string} email - 유저의 이메일
   * @param {string} password - 유저의 비밀번호
   * @return {Promise<User>} - 검증된 유저 정보를 반환
   */
  async validate(email: string, password: string): Promise<User> {
    return await this.userRepository.verifyUserCredentials(email, password);
  }
}
