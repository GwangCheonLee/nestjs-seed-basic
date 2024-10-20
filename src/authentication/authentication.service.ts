import {ConflictException, Injectable} from '@nestjs/common';
import {UserRepository} from '../users/repositories/user.repository';
import {hashPlainText} from '../common/constants/encryption.constant';
import {User} from '../users/entities/user.entity';
import {JwtService} from '@nestjs/jwt';
import {ConfigService} from '@nestjs/config';
import {AuthenticatedUser} from './interfaces/authentication.interface';
import {SignUpRequestBodyDto} from './dto/sign-up-request-body.dto';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  async generateAccessToken(user: User): Promise<string> {
    const accessToken = this.jwtService.sign(
      {
        user: this.extractPayloadFromUser(user),
        sub: user.id,
      },
      {
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
        issuer: 'nestjs-seed',
        audience: user.email,
        algorithm: 'HS256',
      },
    );

    await this.userRepository.update(user.id, {
      currentAccessToken: accessToken,
    });

    return accessToken;
  }

  async generateRefreshToken(user: User): Promise<string> {
    const refreshToken = this.jwtService.sign(
      {
        user: this.extractPayloadFromUser(user),
        sub: user.id,
      },
      {
        secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
        issuer: 'nestjs-seed',
        audience: user.email,
        algorithm: 'HS256',
      },
    );

    await this.userRepository.update(user.id, {
      currentRefreshToken: refreshToken,
    });

    return refreshToken;
  }

  async signUp(
    signUpRequestBodyDto: SignUpRequestBodyDto,
  ): Promise<AuthenticatedUser> {
    const emailExists = await this.userRepository.isEmailRegistered(
      signUpRequestBodyDto.email,
    );

    if (emailExists) {
      throw new ConflictException(
        'This email is already registered. Please use another email.',
      );
    }

    const hashedPassword = await hashPlainText(signUpRequestBodyDto.password);

    const user = await this.userRepository.signUp(
      signUpRequestBodyDto.email,
      hashedPassword,
      signUpRequestBodyDto.nickname,
    );

    return this.extractPayloadFromUser(user);
  }

  async signIn(
    user: User,
  ): Promise<{accessToken: string; refreshToken: string}> {
    return {
      accessToken: await this.generateAccessToken(user),
      refreshToken: await this.generateRefreshToken(user),
    };
  }

  private extractPayloadFromUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
    };
  }
}
