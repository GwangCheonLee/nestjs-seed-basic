import {Body, Controller, HttpCode, Post, UseGuards} from '@nestjs/common';
import {LocalGuard} from './guards/local.guard';
import {AuthService} from './auth.service';
import {SignUpRequestBodyDto} from './dto/sign-up-request-body.dto';
import {User} from '../users/entities/user.entity';
import {GetUser} from '../users/decorators/get-user';
import {SignInResponse, SignUpResponse} from './interfaces/auth.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    return {accessToken: this.authService.generateAccessToken(user)};
  }
}
