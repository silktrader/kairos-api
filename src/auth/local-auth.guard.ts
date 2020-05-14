import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Avoids having to use magic strings in controller's guards
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
