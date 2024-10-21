import {Global, Module} from '@nestjs/common';
import Redis from 'ioredis';
import {RedisRepository} from './redis.repository';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {RedisService} from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      /**
       * Redis 클라이언트를 설정하고 반환합니다.
       *
       * @param {ConfigService} configService - 환경 변수를 관리하는 ConfigService
       * @return {Redis} - 설정된 Redis 클라이언트 인스턴스
       */
      useFactory: (configService: ConfigService): Redis => {
        return new Redis({
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          username: configService.get<string>('REDIS_USERNAME') || undefined,
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        });
      },
      inject: [ConfigService],
    },
    RedisService,
    RedisRepository,
  ],
  exports: ['REDIS_CLIENT', RedisService, RedisRepository],
})
export class RedisModule {}
