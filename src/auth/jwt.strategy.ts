import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from './jwt-payload.interface';
import { User } from './user.entity';
import { ApiConfigService } from '../api-config/api-config.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly cs: ApiConfigService,
    @InjectRepository(User) private readonly userRespository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cs.signingSecret,
    });
  }

  /** Returns a user validated through JWT and fetched from the database or returns a 401 error with `findOneOrFail` */
  async validate(payload: JwtPayload): Promise<User> {
    return await this.userRespository.findOneOrFail(payload.sub);
  }
}
