import {Test, TestingModule} from '@nestjs/testing';
import {AuthenticationController} from './authentication.controller';
import {AuthenticationService} from './authentication.service';
import {ConfigService} from '@nestjs/config';
import {SignUpRequestBodyDto} from './dto/sign-up-request-body.dto';
import {UserWithoutPassword} from '../users/types/user.type';
import {User} from '../users/entities/user.entity';
import {Response} from 'express';
import {JwtRefreshGuard} from './guards/jwt-refresh.guard';
import {JwtAccessGuard} from './guards/jwt-access.guard';
import {GoogleGuard} from './guards/google.guard';
import {LocalGuard} from './guards/local.guard';
import {ExecutionContext, INestApplication} from '@nestjs/common';
import * as request from 'supertest';

describe('AuthenticationController', () => {
  let app: INestApplication;
  let controller: AuthenticationController;
  let authenticationService: jest.Mocked<AuthenticationService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    authenticationService = {
      signUp: jest.fn(),
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      googleSignIn: jest.fn(),
      generateTwoFactorAuthenticationSecret: jest.fn(),
      pipeQrCodeStream: jest.fn(),
    } as unknown as jest.Mocked<AuthenticationService>;

    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        {provide: AuthenticationService, useValue: authenticationService},
        {provide: ConfigService, useValue: configService},
      ],
    })
      .overrideGuard(LocalGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = {id: 1, email: 'test@example.com'}; // 모의 사용자 설정
          return true;
        },
      })
      .overrideGuard(JwtRefreshGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = {id: 1, email: 'test@example.com'}; // 모의 사용자 설정
          return true;
        },
      })
      .overrideGuard(JwtAccessGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = {id: 1, email: 'test@example.com'}; // 모의 사용자 설정
          return true;
        },
      })
      .overrideGuard(GoogleGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = {id: 1, email: 'test@example.com'}; // 모의 사용자 설정
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    await app.init();

    controller = module.get<AuthenticationController>(AuthenticationController);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('signUp', () => {
    it('should call authenticationService.signUp and return the result', async () => {
      const signUpDto: SignUpRequestBodyDto = {
        email: 'test@example.com',
        password: 'password123',
        nickname: 'testUser',
      };

      const userWithoutPassword: UserWithoutPassword = {
        id: 1,
        email: 'test@example.com',
        nickname: 'testUser',
      } as Partial<UserWithoutPassword> as UserWithoutPassword;

      authenticationService.signUp.mockResolvedValueOnce(userWithoutPassword);

      const result = await controller.signUp(signUpDto);

      expect(authenticationService.signUp).toHaveBeenCalledWith(signUpDto);
      expect(result).toEqual(userWithoutPassword);
    });
  });

  describe('signIn', () => {
    it('should generate tokens and set refresh token in cookies', async () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
      } as User;

      const accessToken = 'accessToken';
      const refreshToken = 'refreshToken';

      authenticationService.generateAccessToken.mockResolvedValueOnce(
        accessToken,
      );
      authenticationService.generateRefreshToken.mockResolvedValueOnce(
        refreshToken,
      );

      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'JWT_REFRESH_TOKEN_EXPIRATION_TIME':
            return 7200;
          case 'NODE_ENV':
            return 'development';
          default:
            return null;
        }
      });

      const res = {
        cookie: jest.fn(),
      } as Partial<Response> as Response;

      const result = await controller.signIn(user, res);

      expect(authenticationService.generateAccessToken).toHaveBeenCalledWith(
        user,
      );
      expect(authenticationService.generateRefreshToken).toHaveBeenCalledWith(
        user,
      );
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7200,
        path: '/',
      });
      expect(result).toEqual({accessToken});
    });
  });

  describe('getAccessToken', () => {
    it('should generate a new access token', async () => {
      const user: User = {
        id: 1,
        email: 'test@example.com',
      } as User;

      const accessToken = 'newAccessToken';

      authenticationService.generateAccessToken.mockResolvedValueOnce(
        accessToken,
      );

      const result = await controller.getAccessToken(user);

      expect(authenticationService.generateAccessToken).toHaveBeenCalledWith(
        user,
      );
      expect(result).toEqual({accessToken});
    });
  });

  describe('loginGoogle', () => {
    it('should be defined', () => {
      expect(controller.loginGoogle).toBeDefined();
    });
  });

  describe('googleAuthCallback', () => {
    it('should authenticate user and redirect with access token', async () => {
      const req = {
        user: {
          email: 'google@example.com',
          nickname: 'GoogleUser',
        },
      } as any;

      const res = {
        cookie: jest.fn(),
        redirect: jest.fn(),
      } as unknown as Response;

      const accessToken = 'accessToken';
      const refreshToken = 'refreshToken';

      const authenticatedUser: User = {
        id: 1,
        email: 'google@example.com',
        nickname: 'GoogleUser',
      } as User;

      authenticationService.googleSignIn.mockResolvedValueOnce(
        authenticatedUser,
      );
      authenticationService.generateAccessToken.mockResolvedValueOnce(
        accessToken,
      );
      authenticationService.generateRefreshToken.mockResolvedValueOnce(
        refreshToken,
      );

      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'GOOGLE_AUTH_BASE_REDIRECT_URL':
            return 'http://localhost:3000';
          case 'JWT_REFRESH_TOKEN_EXPIRATION_TIME':
            return 7200;
          case 'NODE_ENV':
            return 'development';
          default:
            return null;
        }
      });

      await controller.googleAuthCallback(req, res, null);

      expect(authenticationService.googleSignIn).toHaveBeenCalledWith(req.user);
      expect(authenticationService.generateAccessToken).toHaveBeenCalledWith(
        authenticatedUser,
      );
      expect(authenticationService.generateRefreshToken).toHaveBeenCalledWith(
        authenticatedUser,
      );

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7200,
        path: '/',
      });

      expect(res.redirect).toHaveBeenCalledWith(
        `http://localhost:3000?accessToken=${accessToken}`,
      );
    });
  });

  describe('generateTwoFactorAuthenticationQrCode', () => {
    it('should generate 2FA secret and pipe QR code', async () => {
      const request = {
        user: {
          id: 1,
          email: 'user@example.com',
        },
      } as any;

      const response = {
        setHeader: jest.fn(),
      } as unknown as Response;

      const otpauthUrl =
        'otpauth://totp/TestApp:user@example.com?secret=secret';

      authenticationService.generateTwoFactorAuthenticationSecret.mockResolvedValueOnce(
        {
          secret: 'secret',
          otpauthUrl,
        },
      );

      authenticationService.pipeQrCodeStream.mockResolvedValueOnce(undefined);

      await controller.generateTwoFactorAuthenticationQrCode(request, response);

      expect(
        authenticationService.generateTwoFactorAuthenticationSecret,
      ).toHaveBeenCalledWith(request.user);
      expect(response.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'image/png',
      );
      expect(authenticationService.pipeQrCodeStream).toHaveBeenCalledWith(
        response,
        otpauthUrl,
      );
    });
  });
  describe('AuthenticationController 추가 테스트', () => {
    describe('signUp 실패 케이스', () => {
      it('should throw an error if signUp fails', async () => {
        const signUpDto: SignUpRequestBodyDto = {
          email: 'test@example.com',
          password: 'password123',
          nickname: 'testUser',
        };

        authenticationService.signUp.mockRejectedValueOnce(
          new Error('Failed to sign up'),
        );

        await expect(controller.signUp(signUpDto)).rejects.toThrow(
          'Failed to sign up',
        );
        expect(authenticationService.signUp).toHaveBeenCalledWith(signUpDto);
      });
    });

    describe('signIn 실패 케이스', () => {
      it('should throw an error if token generation fails', async () => {
        const user: User = {
          id: 1,
          email: 'test@example.com',
        } as User;

        authenticationService.generateAccessToken.mockRejectedValueOnce(
          new Error('Access token generation failed'),
        );

        const res = {
          cookie: jest.fn(),
        } as Partial<Response> as Response;

        await expect(controller.signIn(user, res)).rejects.toThrow(
          'Access token generation failed',
        );
        expect(authenticationService.generateAccessToken).toHaveBeenCalledWith(
          user,
        );
      });
    });

    describe('getAccessToken 실패 케이스', () => {
      it('should throw an error if generating access token fails', async () => {
        const user: User = {
          id: 1,
          email: 'test@example.com',
        } as User;

        authenticationService.generateAccessToken.mockRejectedValueOnce(
          new Error('Failed to generate access token'),
        );

        await expect(controller.getAccessToken(user)).rejects.toThrow(
          'Failed to generate access token',
        );
        expect(authenticationService.generateAccessToken).toHaveBeenCalledWith(
          user,
        );
      });
    });

    describe('googleAuthCallback 실패 케이스', () => {
      it('should handle error when googleSignIn fails', async () => {
        const req = {
          user: {
            email: 'google@example.com',
            nickname: 'GoogleUser',
          },
        } as any;

        const res = {
          cookie: jest.fn(),
          redirect: jest.fn(),
        } as unknown as Response;

        authenticationService.googleSignIn.mockRejectedValueOnce(
          new Error('Google sign-in failed'),
        );

        await expect(
          controller.googleAuthCallback(req, res, null),
        ).rejects.toThrow('Google sign-in failed');
        expect(authenticationService.googleSignIn).toHaveBeenCalledWith(
          req.user,
        );
      });
    });

    describe('generateTwoFactorAuthenticationQrCode 실패 케이스', () => {
      it('should handle error when generating 2FA QR code fails', async () => {
        const request = {
          user: {
            id: 1,
            email: 'user@example.com',
          },
        } as any;

        const response = {
          setHeader: jest.fn(),
        } as unknown as Response;

        authenticationService.generateTwoFactorAuthenticationSecret.mockRejectedValueOnce(
          new Error('Failed to generate 2FA secret'),
        );

        await expect(
          controller.generateTwoFactorAuthenticationQrCode(request, response),
        ).rejects.toThrow('Failed to generate 2FA secret');
        expect(
          authenticationService.generateTwoFactorAuthenticationSecret,
        ).toHaveBeenCalledWith(request.user);
      });
    });

    describe('loginGoogle', () => {
      it('should redirect to Google login page', async () => {
        const response = await request(app.getHttpServer()).get(
          '/authentication/google/sign-in',
        );

        expect(response.status).toBe(200);
      });
    });

    describe('googleAuthCallback', () => {
      // 기존 테스트 유지...

      it('should redirect to state URL with access token when state is provided', async () => {
        const req = {
          user: {
            email: 'google@example.com',
            nickname: 'GoogleUser',
          },
        } as any;

        const res = {
          cookie: jest.fn(),
          redirect: jest.fn(),
        } as unknown as Response;

        const accessToken = 'accessToken';
        const refreshToken = 'refreshToken';

        const authenticatedUser: User = {
          id: 1,
          email: 'google@example.com',
          nickname: 'GoogleUser',
        } as User;

        authenticationService.googleSignIn.mockResolvedValueOnce(
          authenticatedUser,
        );
        authenticationService.generateAccessToken.mockResolvedValueOnce(
          accessToken,
        );
        authenticationService.generateRefreshToken.mockResolvedValueOnce(
          refreshToken,
        );

        configService.get.mockImplementation((key: string) => {
          switch (key) {
            case 'GOOGLE_AUTH_BASE_REDIRECT_URL':
              return 'http://localhost:3000';
            case 'JWT_REFRESH_TOKEN_EXPIRATION_TIME':
              return 7200;
            case 'NODE_ENV':
              return 'development';
            default:
              return null;
          }
        });

        const stateUrl = 'http://custom-redirect-url.com';
        await controller.googleAuthCallback(req, res, stateUrl);

        expect(res.redirect).toHaveBeenCalledWith(
          `${stateUrl}?accessToken=${accessToken}`,
        );
      });
    });

    describe('Guard 동작 확인', () => {
      beforeEach(async () => {
        // Guard를 거부하도록 설정
        await app.close(); // 이전 인스턴스 종료
        const module: TestingModule = await Test.createTestingModule({
          controllers: [AuthenticationController],
          providers: [
            {provide: AuthenticationService, useValue: authenticationService},
            {provide: ConfigService, useValue: configService},
          ],
        })
          .overrideGuard(LocalGuard)
          .useValue({
            canActivate: jest.fn(() => false),
          })
          .compile();

        app = module.createNestApplication();
        await app.init();
      });

      afterEach(async () => {
        await app.close();
      });

      it('should restrict access when LocalGuard denies', async () => {
        const response = await request(app.getHttpServer())
          .post('/authentication/sign-in')
          .send({email: 'test@example.com', password: 'password123'});

        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Forbidden resource');
      });
    });
  });
});
