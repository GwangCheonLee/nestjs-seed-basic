import { ValidationPipe } from '@nestjs/common';
import * as Joi from 'joi';

/**
 * Generates a ValidationPipe configuration
 * @returns {ValidationPipe} Configured instance of ValidationPipe
 */
export const validationPipeConfig = (): ValidationPipe => {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  });
};

/**
 * Defines a Joi validation schema for environment variables
 * @returns {Joi.ObjectSchema} Joi object schema for env variables
 */
export const validationSchemaConfig = (): Joi.ObjectSchema => {
  return Joi.object({
    TZ: Joi.string().default('UTC'),
    APPLICATION_ENV: Joi.string().required(),
    SERVER_PORT: Joi.number().default(3000),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.string().required(),
    DB_NAME: Joi.string().required(),
    DB_USER_NAME: Joi.string().required(),
    DB_USER_PASSWORD: Joi.string().required(),
    JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
    JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.string().required(),
    JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
    JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().required(),
  });
};
