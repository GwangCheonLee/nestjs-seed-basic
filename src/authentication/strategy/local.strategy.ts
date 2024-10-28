import {Injectable, UnauthorizedException} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-local';
import {GuardEnum} from '../enum/guard.enum';
import {UserRepository} from '../../users/repositories/user.repository';
import {User} from '../../users/entities/user.entity';
import {authenticator} from 'otplib';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, GuardEnum.LOCAL) {
  constructor(private readonly userRepository: UserRepository) {
    super({
      usernameField: 'email',
      passReqToCallback: true, // 요청 객체를 콜백으로 전달
    });
  }

  /**
   * 로컬 전략으로 유저 자격 증명과 2FA 코드를 검증하는 메서드입니다.
   *
   * @param {Request} req - 요청 객체
   * @param {string} email - 유저의 이메일
   * @param {string} password - 유저의 비밀번호
   * @return {Promise<User>} - 검증된 유저 정보를 반환
   */
  async validate(req: Request, email: string, password: string): Promise<User> {
    const user = await this.userRepository.verifyUserCredentials(
      email,
      password,
    );

    if (user && user.twoFactorAuthenticationSecret) {
      const twoFactorAuthenticationCode: string =
        req.body['twoFactorAuthenticationCode'];

      if (!twoFactorAuthenticationCode) {
        throw new UnauthorizedException('Invalid credentials provided.');
      }

      const isTwoFactorCodeValid = this.isTwoFactorCodeValid(
        user,
        twoFactorAuthenticationCode,
      );

      if (!isTwoFactorCodeValid) {
        throw new UnauthorizedException('Invalid credentials provided.');
      }
    }

    return user;
  }

  /**
   * 2FA 코드의 유효성을 검증하는 메서드
   *
   * @param {User} user - 유저 객체
   * @param {string} code - 2FA 인증 코드
   * @return {boolean} - 인증 코드의 유효성
   */
  private isTwoFactorCodeValid(user: User, code: string): boolean {
    return authenticator.verify({
      token: code,
      secret: user.twoFactorAuthenticationSecret,
    });
  }
}
