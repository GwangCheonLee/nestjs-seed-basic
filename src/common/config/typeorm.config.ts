import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

/**
 * TypeormConfig class is responsible for creating the TypeOrmModuleOptions object.
 */
@Injectable()
export class TypeormConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST'),
      port: this.configService.get('DB_PORT'),
      username: this.configService.get('DB_USER_NAME'),
      password: this.configService.get('DB_USER_PASSWORD'),
      database: this.configService.get('DB_NAME'),
      synchronize: false,
      logging: false,
      entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    };
  }
}
