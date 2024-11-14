import {Test, TestingModule} from '@nestjs/testing';
import {ConfigService} from '@nestjs/config';
import {GoogleStrategy} from './google.strategy';
import {Profile} from 'passport-google-oauth20';
import {ProviderEnum} from '../enum/provider.enum';

describe('GoogleStrategy', () => {
  let googleStrategy: GoogleStrategy;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'GOOGLE_AUTH_CLIENT_ID':
                  return 'test-client-id';
                case 'GOOGLE_AUTH_CLIENT_SECRET':
                  return 'test-client-secret';
                case 'GOOGLE_AUTH_CALLBACK_URL':
                  return 'http://localhost:3000/auth/google/callback';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    googleStrategy = module.get<GoogleStrategy>(GoogleStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(googleStrategy).toBeDefined();
  });

  it('should validate user profile and return user data', async () => {
    const profile: Profile = {
      id: '123456',
      displayName: 'Test User',
      emails: [
        {
          value: 'testuser@example.com',
          verified: false,
        },
      ],
      photos: [{value: 'http://example.com/photo.jpg'}],
      provider: 'google',
      _json: {
        iss: '',
        aud: '',
        sub: '',
        iat: 0,
        exp: 0,
      },
      _raw: '',
      name: {familyName: 'User', givenName: 'Test'},
    } as Profile;

    const result = googleStrategy.validate(
      'test-access-token',
      'test-refresh-token',
      profile,
    );

    expect(result).toEqual({
      oauthProvider: ProviderEnum.GOOGLE,
      email: 'testuser@example.com',
      nickname: 'Test User',
      profileImage: 'http://example.com/photo.jpg',
    });
  });

  it('should configure GoogleStrategy correctly from ConfigService', () => {
    expect(configService.get).toHaveBeenCalledWith('GOOGLE_AUTH_CLIENT_ID');
    expect(configService.get).toHaveBeenCalledWith('GOOGLE_AUTH_CLIENT_SECRET');
    expect(configService.get).toHaveBeenCalledWith('GOOGLE_AUTH_CALLBACK_URL');
  });
});
