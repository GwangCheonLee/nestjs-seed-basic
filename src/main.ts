import {NestFactory, Reflector} from '@nestjs/core';
import {ConfigService} from '@nestjs/config';
import {AppModule} from './app.module';
import {validationPipeConfig} from './common/config/validation.config';
import {ClassSerializerInterceptor, VersioningType} from '@nestjs/common';
import helmet from 'helmet';
import {getLogLevels} from './common/config/logger.config';
import * as cookieParser from 'cookie-parser';

/**
 * 애플리케이션을 초기화하고 서버를 시작합니다.
 * @return {Promise<void>} 비동기 부트스트랩 함수입니다.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: getLogLevels(process.env.NODE_ENV),
  });

  const configService = app.get(ConfigService);

  // 글로벌 파이프 설정 (유효성 검사)
  app.useGlobalPipes(validationPipeConfig());

  // 보안 미들웨어 (Helmet)
  app.use(helmet());

  // 쿠키 파서 적용
  app.use(cookieParser());

  // 글로벌 인터셉터 (클래스 직렬화, 비밀번호 필드 제외 등)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // CORS 허용
  app.enableCors();

  // URI 기반의 API 버전 관리 활성화
  app.enableVersioning({type: VersioningType.URI});

  // 글로벌 프리픽스 설정 (API_PREFIX 환경 변수로부터)
  app.setGlobalPrefix(configService.get('API_PREFIX'));

  const port = configService.get('SERVER_PORT') || 3000;
  await app.listen(port);
}

bootstrap();
