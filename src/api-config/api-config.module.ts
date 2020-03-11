import { Module } from '@nestjs/common';
import { ApiConfigService } from './api-config.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  exports: [ApiConfigService],
  providers: [ApiConfigService],
})
export class ApiConfigModule {}
