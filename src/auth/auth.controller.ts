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
  Session,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { User } from '@src/users/user.decorator';
import { UserEntity } from '@src/users/entities/user.entity';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { SignInDto } from './dto/auth.dto';
import { generateToken } from '@src/config/csrf.config';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('csrf-token')
  getCsrfToken(@Req() req: Request) {
    const token = generateToken(req);
    return token;
  }

  @Post('data')
  protectedRoute(@Res() res: Response) {
    return res.json({ message: 'CSRF validation successful!' });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async signinJwt(@Body() dto: SignInDto) {
    const user = await this.authService.validateUser(dto);
    const tokens = await this.authService.getTokens(user.id, user.email);
    await this.authService.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  @Post('login2')
  @HttpCode(HttpStatus.OK)
  async loginSession(
    @Body() dto: SignInDto,
    @Session() session: Record<string, any>,
  ) {
    const user = await this.authService.validateUser(dto);

    session.userId = user.id;
    session.email = user.email;

    return {
      message: 'Logged in successfully',
      user: { id: user.id, email: user.email },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refreshJwt(
    @Body('refresh_token') refresh_token: string,
    @Body('user_id') id: string,
  ) {
    return this.authService.refreshTokens(id, refresh_token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async signoutJwt(@User('sub') userId: string) {
    return this.authService.signOut(userId);
  }

  @Post('logout2')
  @HttpCode(HttpStatus.OK)
  async logoutSession(@Session() session: Record<string, any>) {
    if (!session.userId) {
      return { message: 'Already logged out' };
    }

    return new Promise((resolve, reject) => {
      session.destroy((error) => {
        if (error) {
          reject(new UnauthorizedException('Could not log out'));
        }
        resolve({ message: 'Logout successful' });
      });
    });
  }

  @Get('jwtinfo')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  jwtInfo(
    @User(new ValidationPipe({ validateCustomDecorators: true }))
    user: UserEntity,
  ) {
    return user;
  }
}
