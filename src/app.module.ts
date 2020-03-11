import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiConfigService } from './api-config/api-config.service';
import { ApiConfigModule } from './api-config/api-config.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      useFactory: async (cs: ApiConfigService) => cs.databaseConfiguration,
    }),
    AuthModule,
    ApiConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
