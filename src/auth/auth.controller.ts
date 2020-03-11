import { Controller, Post, Body } from '@nestjs/common';
import { CredentialsDto } from './credentials.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  signUp(@Body() credentialsDto: CredentialsDto): Promise<void> {
    return this.authService.signUp(credentialsDto);
  }

  @Post('/signin')
  signIn(
    @Body() credentialsDto: CredentialsDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.signIn(credentialsDto);
  }
}
