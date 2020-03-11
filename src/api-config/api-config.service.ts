import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Injectable()
export class ApiConfigService {
  constructor(private readonly configService: ConfigService) {}

  get databaseConfiguration(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: this.configService.get<string>('DATABASE_USER'),
      password: this.configService.get<string>('DATABASE_PASSWORD'),
      database: 'kairos',
      entities: [__dirname + '/../**/*.entity.{js,ts}'], // any entity file will be mapped, the .js extension is needed
      synchronize: true,
    };
  }

  get signingSecret(): string {
    return this.configService.get<string>('SECRET');
  }

  get tokensExpiration(): string {
    return this.configService.get<string>('TOKENS_EXPIRATION');
  }
}
