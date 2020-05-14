import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { CredentialsDto } from './credentials.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SigninDto } from './signin.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(credentialsDto: CredentialsDto): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      email: credentialsDto.email,
    });
    if (existingUser) {
      throw new ConflictException(
        `${credentialsDto.email} is already registered`,
      );
    }

    // generate salts to secure passwords
    const hash = await bcrypt.hash(credentialsDto.password, 10);

    // create and save user
    const user = this.userRepository.create({
      email: credentialsDto.email,
      hash: hash,
    });

    await this.userRepository.save(user);
  }

  async signIn(user: User): Promise<SigninDto> {
    // the `sub` property is a JWT standard, this payload will allow quick lookups of users without performing database queries
    const payload: JwtPayload = { username: user.email, sub: user.id };
    return {
      id: user.id,
      name: user.email,
      token: this.jwtService.sign(payload),
    };
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ email: username });
    if (user && (await bcrypt.compare(password, user.hash))) {
      // strip irrelevant properties from the user
      return { id: user.id, email: user.email };
    }
    return null;
  }
}
