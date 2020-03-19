import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CredentialsDto } from './credentials.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SigninDto } from './signin.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(credentialsDto: CredentialsDto): Promise<void> {
    return this.userRepository.signUp(credentialsDto);
  }

  async signIn(credentialsDto: CredentialsDto): Promise<SigninDto> {
    const user = await this.userRepository.findOne(credentialsDto);

    const valid = user && bcrypt.compare(credentialsDto.password, user.hash);
    if (!valid)
      throw new UnauthorizedException('Invalid email address or password');

    return {
      id: user.id,
      name: user.email,
      token: this.jwtService.sign({ email: credentialsDto.email }),
    };
  }
}
