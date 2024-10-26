import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Profile, Strategy} from 'passport-google-oauth20';
import {ConfigService} from '@nestjs/config';
import {ProviderEnum} from '../enum/provider.enum';
import {User} from '../../users/entities/user.entity';

@Injectable()
/**
 * GoogleStrategy는 Google OAuth 2.0을 통한 인증을 처리하는 전략입니다.
 * 클라이언트 ID, 시크릿, 콜백 URL 등을 사용하여 Google 로그인 절차를 처리합니다.
 */
export class GoogleStrategy extends PassportStrategy(
  Strategy,
  ProviderEnum.GOOGLE,
) {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_AUTH_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_AUTH_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_AUTH_CALLBACK_URL'),
      scope: ['profile', 'email'],
    });
  }

  /**
   * Google 로그인 성공 후 호출되는 메서드입니다.
   * 사용자 정보를 반환하거나, 새 사용자를 등록합니다.
   *
   * @param {string} accessToken - 구글에서 발급된 액세스 토큰
   * @param {string} refreshToken - 구글에서 발급된 리프레시 토큰
   * @param {Profile} profile - 구글 계정의 사용자 프로필 정보
   * @return {Partial<User>} - 생성되거나 조회된 사용자 정보
   */
  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Partial<User> {
    const oauthProvider = ProviderEnum.GOOGLE;
    const email = profile.emails[0].value;
    const nickname = profile.displayName;
    const photo = profile.photos[0].value;

    return {
      oauthProvider,
      email,
      nickname,
      profileImage: photo,
    };
  }
}
