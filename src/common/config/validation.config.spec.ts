// Sample DTO for testing
import {BadRequestException, ValidationPipe} from '@nestjs/common';
import * as Joi from 'joi';
import {
  validationPipeConfig,
  validationSchemaConfig,
} from './validation.config';
import {IsString} from 'class-validator';

class TestDto {
  @IsString()
  allowedProp!: string;
}

describe('ValidationPipe Configuration', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    });
  });

  it('should strip properties not included in the DTO (whitelist)', async () => {
    const testDto = {allowedProp: 'value', notAllowedProp: 'value'};
    const transformedDto = await pipe.transform(testDto, {
      type: 'body',
      metatype: TestDto,
    });

    expect(transformedDto).toEqual({allowedProp: 'value'});
  });

  it('should throw an error for properties not listed in the DTO (forbidNonWhitelisted)', async () => {
    pipe = validationPipeConfig();
    const testDto = {notAllowedProp: 'value'};

    await expect(
      pipe.transform(testDto, {
        type: 'body',
        metatype: TestDto,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should transform payload according to the metatype (transform)', async () => {
    const testDto = {allowedProp: 123};

    await expect(
      pipe.transform(testDto, {
        type: 'body',
        metatype: TestDto,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('Joi Validation Schema Configuration', () => {
  let schema: Joi.ObjectSchema;

  beforeEach(() => {
    schema = validationSchemaConfig();
  });

  it('should validate environment variables and set default values for optional fields', () => {
    const result = schema.validate({
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'testdb',
      DB_USER_NAME: 'user',
      DB_USER_PASSWORD: 'password',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      JWT_ACCESS_TOKEN_SECRET: 'secret',
      JWT_ACCESS_TOKEN_EXPIRATION_TIME: 3600,
      JWT_REFRESH_TOKEN_SECRET: 'secret',
      JWT_REFRESH_TOKEN_EXPIRATION_TIME: 86400,
      GOOGLE_AUTH_CLIENT_ID: 'clientId',
      GOOGLE_AUTH_CLIENT_SECRET: 'clientSecret',
      GOOGLE_AUTH_CALLBACK_URL: 'http://localhost/callback',
      GOOGLE_AUTH_BASE_REDIRECT_URL: 'http://localhost',
      TWO_FACTOR_AUTHENTICATION_APP_NAME: 'MyApp',
    });

    expect(result.error).toBeUndefined();
    expect(result.value.TZ).toBe('UTC');
    expect(result.value.SERVER_PORT).toBe(3000);
    expect(result.value.API_PREFIX).toBe('api');
    expect(result.value.LIMIT_CONCURRENT_LOGIN).toBe(false);
  });

  it('should throw an error if required fields are missing', () => {
    const {error} = schema.validate({});

    expect(error).toBeDefined();
    expect(error!.details[0].message).toContain('"DB_HOST" is required');
  });

  it('should not return errors for optional fields when they are missing', () => {
    const result = schema.validate({
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'testdb',
      DB_USER_NAME: 'user',
      DB_USER_PASSWORD: 'password',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      JWT_ACCESS_TOKEN_SECRET: 'secret',
      JWT_ACCESS_TOKEN_EXPIRATION_TIME: 3600,
      JWT_REFRESH_TOKEN_SECRET: 'secret',
      JWT_REFRESH_TOKEN_EXPIRATION_TIME: 86400,
      GOOGLE_AUTH_CLIENT_ID: 'clientId',
      GOOGLE_AUTH_CLIENT_SECRET: 'clientSecret',
      GOOGLE_AUTH_CALLBACK_URL: 'http://localhost/callback',
      GOOGLE_AUTH_BASE_REDIRECT_URL: 'http://localhost',
      TWO_FACTOR_AUTHENTICATION_APP_NAME: 'MyApp',
    });

    expect(result.error).toBeUndefined();
  });
});
