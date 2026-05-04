import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  ValidationPipe,
  Req,
  Res,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { User } from '@src/users/user.decorator';
import { UserEntity } from '@src/users/entities/user.entity';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { SignInDto } from './dto/auth.dto';
import { generateCsrfToken } from '@src/config/csrf.config';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('csrf-token')
  getCsrfToken(@Req() req: Request, @Res() res: Response) {
    const csrfToken = generateCsrfToken(req, res);
    return res.json({ csrfToken });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async signInUseDB(@Body() dto: SignInDto) {
    const user = await this.authService.validateUser(dto);
    const tokens = await this.authService.getTokens(user.id, user.email);
    await this.authService.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @Body('refresh_token') refresh_token: string,
    @Body('user_id') id: string,
  ) {
    return this.authService.refreshTokens(id, refresh_token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async signOut(@User('sub') userId: string) {
    return this.authService.signOut(userId);
  }

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  getProfile(
    @User(new ValidationPipe({ validateCustomDecorators: true }))
    user: UserEntity,
  ) {
    return user;
  }
}
