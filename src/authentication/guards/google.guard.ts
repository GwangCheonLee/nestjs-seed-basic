import {Injectable} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ProviderEnum} from '../enum/provider.enum';

/**
 * Google OAuth 인증을 처리하는 Guard입니다.
 * Google 로그인 요청 시 Passport의 인증 전략을 사용합니다.
 */
@Injectable()
export class GoogleGuard extends AuthGuard(ProviderEnum.GOOGLE) {}
