import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { validationPipeConfig } from './common/config/validation.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(validationPipeConfig());
  app.enableCors();

  const configService = app.get(ConfigService);
  const port = configService.get('SERVER_PORT') || 3000;

  await app.listen(port);
}

bootstrap();
