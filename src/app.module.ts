import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {TypeormConfig} from './common/config/typeorm.config';
import {ConfigModule} from '@nestjs/config';
import {validationSchemaConfig} from './common/config/validation.config';
import {getEnvPath} from './common/config/env-path.config';
import {AuthModule} from './auth/auth.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forRootAsync({
      useClass: TypeormConfig,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getEnvPath(),
      validationSchema: validationSchemaConfig(),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
/**
 * 애플리케이션의 루트 모듈을 정의합니다.
 * TypeORM 설정, 환경 설정, 인증 모듈을 포함합니다.
 */
export class AppModule {}
