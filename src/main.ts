import {NestFactory} from '@nestjs/core';
import {ConfigService} from '@nestjs/config';
import {AppModule} from './app.module';
import {validationPipeConfig} from './common/config/validation.config';
import {VersioningType} from '@nestjs/common';
import helmet from 'helmet';
import {getLogLevels} from './common/config/logger.config';

/**
 * 애플리케이션을 초기화하고 서버를 시작합니다.
 * @return {Promise<void>} 비동기 부트스트랩 함수입니다.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: getLogLevels(process.env.NODE_ENV),
  });

  app.useGlobalPipes(validationPipeConfig());
  app.enableCors();
  app.enableVersioning({type: VersioningType.URI});
  app.use(helmet());

  const configService = app.get(ConfigService);
  const port = configService.get('SERVER_PORT') || 3000;

  await app.listen(port);
}

bootstrap();
