import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ApiConfigService } from '../api-config/api-config.service';
import { ApiConfigModule } from 'src/api-config/api-config.module';
import { User } from './user.entity';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [
    ApiConfigModule,
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
      useFactory: async (cs: ApiConfigService) => ({
        secret: cs.signingSecret,
        signOptions: { expiresIn: cs.tokensExpiration },
      }),
    }),
  ],
  exports: [PassportModule],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
