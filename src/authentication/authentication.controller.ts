import {Body, Controller, HttpCode, Post, UseGuards} from '@nestjs/common';
import {LocalGuard} from './guards/local.guard';
import {AuthenticationService} from './authentication.service';
import {SignUpRequestBodyDto} from './dto/sign-up-request-body.dto';
import {User} from '../users/entities/user.entity';
import {GetUser} from '../users/decorators/get-user';
import {
  SignInResponse,
  SignUpResponse,
} from './interfaces/authentication.interface';
import {JwtRefreshGuard} from './guards/jwt-refresh.guard';

@Controller({version: '1', path: 'authentication'})
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  /**
   * 회원가입 엔드포인트입니다.
   *
   * @param {SignUpRequestBodyDto} signUpDto - 회원가입 요청 데이터
   * @return {Promise<SignUpResponse>} - 회원가입 완료 후 응답 데이터
   */
  @Post('/sign-up')
  async signUp(
    @Body() signUpDto: SignUpRequestBodyDto,
  ): Promise<SignUpResponse> {
    return this.authService.signUp(signUpDto);
  }

  /**
   * 로그인 엔드포인트입니다.
   * 유저가 자격 증명을 통해 로그인을 시도하며, 성공 시 액세스 토큰과 리프레시 토큰을 반환합니다.
   *
   * @param {User} user - 로그인한 유저 정보
   * @return {Promise<SignInResponse>} - 로그인 성공 후 액세스 토큰과 리프레시 토큰 반환
   */
  @Post('/sign-in')
  @HttpCode(200)
  @UseGuards(LocalGuard)
  async signIn(@GetUser() user: User): Promise<SignInResponse> {
    return this.authService.signIn(user);
  }

  /**
   * 리프레시 토큰을 이용해 새로운 액세스 토큰을 발급받는 엔드포인트입니다.
   *
   * @param {User} user - 리프레시 토큰으로 인증된 유저 정보
   * @return {Promise<{accessToken: string}>} - 새롭게 발급된 액세스 토큰
   */
  @Post('access-token')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(200)
  async getAccessToken(@GetUser() user: User): Promise<{accessToken: string}> {
    const accessToken = await this.authService.generateAccessToken(user);
    return {accessToken};
  }
}
