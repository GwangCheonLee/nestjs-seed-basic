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

  @Post('/sign-up')
  async signUp(
    @Body() signUpDto: SignUpRequestBodyDto,
  ): Promise<SignUpResponse> {
    return this.authService.signUp(signUpDto);
  }

  @Post('/sign-in')
  @HttpCode(200)
  @UseGuards(LocalGuard)
  async signIn(@GetUser() user: User): Promise<SignInResponse> {
    return this.authService.signIn(user);
  }

  @Post('access-token')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(200)
  async getAccessToken(@GetUser() user: User) {
    const accessToken = await this.authService.generateAccessToken(user);
    return {accessToken};
  }
}
