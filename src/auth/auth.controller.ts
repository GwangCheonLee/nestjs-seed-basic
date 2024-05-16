import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { LocalGuard } from './guards/local.guard';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { User } from '../users/entities/user.entity';
import { GetUser } from '../common/decorators/get-user';
import { SignInResponse, SignUpResponse } from './interfaces/auth.interface';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-up')
  async signUp(@Body() signUpDto: SignUpDto): Promise<SignUpResponse> {
    return this.authService.signUp(
      signUpDto.email,
      signUpDto.password,
      signUpDto.nickname,
    );
  }

  @Post('/sign-in')
  @HttpCode(200)
  @UseGuards(LocalGuard)
  async signIn(@GetUser() user: User): Promise<SignInResponse> {
    return { accessToken: this.authService.generateAccessToken(user) };
  }
}
