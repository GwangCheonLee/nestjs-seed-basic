import {Response} from 'express';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {LocalGuard} from './guards/local.guard';
import {AuthenticationService} from './authentication.service';
import {SignUpRequestBodyDto} from './dto/sign-up-request-body.dto';
import {User} from '../users/entities/user.entity';
import {GetUser} from '../users/decorators/get-user';
import {SignInResponse} from './interfaces/authentication.interface';
import {JwtRefreshGuard} from './guards/jwt-refresh.guard';
import {ConfigService} from '@nestjs/config';
import {UserWithoutPassword} from '../users/types/user.type';
import {GoogleGuard} from './guards/google.guard';
import RequestWithUser from '../common/interfaces/request-with-user.interface';

@Controller({version: '1', path: 'authentication'})
export class AuthenticationController {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 회원가입 엔드포인트입니다.
   *
   * @param {SignUpRequestBodyDto} signUpDto - 회원가입 요청 데이터
   * @return {Promise<UserWithoutPassword>} - 회원가입 완료 후 응답 데이터
   */
  @Post('/sign-up')
  async signUp(
    @Body() signUpDto: SignUpRequestBodyDto,
  ): Promise<UserWithoutPassword> {
    return this.authService.signUp(signUpDto);
  }

  /**
   * 로그인 엔드포인트입니다.
   * 유저가 자격 증명을 통해 로그인을 시도하며, 성공 시 액세스 토큰을 반환하고
   * HttpOnly 쿠키로 리프레시 토큰을 설정합니다.
   *
   * @param {User} user - 로그인한 유저 정보
   * @param {Response} res - HTTP 응답 객체로, 리프레시 토큰을 HttpOnly 쿠키로 설정합니다.
   *  passthrough 옵션을 사용하여 쿠키 설정과 프레임워크 형태의 return 값을 모두 가능하게 합니다.
   * @return {Promise<SignInResponse>} - 로그인 성공 후 액세스 토큰을 반환합니다.
   */
  @Post('/sign-in')
  @HttpCode(200)
  @UseGuards(LocalGuard)
  async signIn(
    @GetUser() user: User,
    @Res({passthrough: true}) res: Response,
  ): Promise<SignInResponse> {
    // Access Token, Refresh Token 생성
    const accessToken = await this.authService.generateAccessToken(user);
    const refreshToken = await this.authService.generateRefreshToken(user);

    const refreshTokenExpirationTime: number = this.configService.get(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
    );
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    // Refresh Token을 HttpOnly 쿠키로 설정
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: refreshTokenExpirationTime,
      path: '/',
    });

    return {accessToken};
  }

  /**
   * 리프레시 토큰을 이용해 새로운 액세스 토큰을 발급받는 엔드포인트입니다.
   *
   * @param {User} user - 리프레시 토큰으로 인증된 유저 정보
   * @return {Promise<SignInResponse>} - 새롭게 발급된 액세스 토큰
   */
  @Post('access-token')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(200)
  async getAccessToken(@GetUser() user: User): Promise<SignInResponse> {
    const accessToken = await this.authService.generateAccessToken(user);
    return {accessToken};
  }

  /**
   * Google 로그인 페이지로 리디렉션하는 엔드포인트입니다.
   * 사용자가 이 엔드포인트에 접근하면 Google 로그인 화면으로 이동합니다.
   */
  @Get('/google/sign-in')
  @UseGuards(GoogleGuard)
  async loginGoogle() {}

  /**
   * Google 로그인 성공 후 Google에서 콜백하는 엔드포인트입니다.
   * Google 인증이 완료되면 사용자 정보를 반환하고, Access Token과 Refresh Token을 발급합니다.
   *
   * @param {RequestWithUser} req - Google 인증 후 반환된 사용자 정보가 포함된 요청 객체
   * @param {Response} res - 응답 객체, 클라이언트로 리다이렉트하거나 HttpOnly 쿠키를 설정합니다.
   * @param {state} state - Google 로그인 요청 시 Front Redirect URL
   * @return {Promise<SignInResponse>} - Access Token을 포함한 응답
   */
  @Get('/google/callback')
  @UseGuards(GoogleGuard)
  async googleAuthCallback(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Query('state') state: string,
  ): Promise<void> {
    const googleAuthBaseRedirectUrl = this.configService.get<string>(
      'GOOGLE_AUTH_BASE_REDIRECT_URL',
    );
    const googleUser: Partial<User> = req.user; // 구글 인증된 사용자 정보

    // 구글 로그인 또는 회원가입 후 사용자 정보 반환
    const authenticatedUser = await this.authService.googleSignIn(googleUser);

    // Access Token 및 Refresh Token 발급
    const accessToken =
      await this.authService.generateAccessToken(authenticatedUser);
    const refreshToken =
      await this.authService.generateRefreshToken(authenticatedUser);

    const refreshTokenExpirationTime: number = this.configService.get<number>(
      'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
    );

    const isProduction = this.configService.get('NODE_ENV') === 'production';

    // Refresh Token을 HttpOnly 쿠키로 설정
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: refreshTokenExpirationTime,
      path: '/',
    });

    return res.redirect(
      `${state || googleAuthBaseRedirectUrl}?accessToken=${accessToken}`,
    );
  }
}
