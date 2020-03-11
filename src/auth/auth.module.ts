import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from './user.repository';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ApiConfigService } from '../api-config/api-config.service';
import { ApiConfigModule } from 'src/api-config/api-config.module';

@Module({
  imports: [
    ApiConfigModule,
    TypeOrmModule.forFeature([UserRepository]),
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
  exports: [JwtStrategy, PassportModule],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
