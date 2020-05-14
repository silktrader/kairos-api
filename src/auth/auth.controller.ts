import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { CredentialsDto } from './credentials.dto';
import { AuthService } from './auth.service';
import { SigninDto } from './signin.dto';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  signUp(@Body() credentialsDto: CredentialsDto): Promise<void> {
    return this.authService.signUp(credentialsDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/signin')
  async signIn(@Request() request): Promise<SigninDto> {
    // will only be invoked if the user has been validated by the local auth guard
    return this.authService.signIn(request.user);
  }
}
