import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CredentialsDto } from './credentials.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(credentialsDto: CredentialsDto): Promise<void> {
    return this.userRepository.signUp(credentialsDto);
  }

  async signIn(
    credentialsDto: CredentialsDto,
  ): Promise<{ accessToken: string }> {
    const valid = await this.userRepository.validateUser(credentialsDto);
    if (!valid)
      throw new UnauthorizedException('Invalid email address or password');

    const payload: JwtPayload = { email: credentialsDto.email };
    return { accessToken: this.jwtService.sign(payload) };
  }
}
