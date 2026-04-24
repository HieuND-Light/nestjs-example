import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma.service';
import { User } from 'src/users/user.decorator';
import { UserEntity } from 'src/users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @Post('login2')
  @HttpCode(HttpStatus.OK)
  async signInUseDB(@Body() dto: any) {
    const user = await this.authService.validateUser(dto);
    const tokens = await this.authService.getTokens(user.id, user.email);
    await this.authService.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body('refresh_token') refresh_token: string,
    @Body('user_id') id: number,
  ) {
    return this.authService.refreshTokens(id, refresh_token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async signOut(@Body('user_id') id: number) {
    return this.authService.signOut(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(
    @User(new ValidationPipe({ validateCustomDecorators: true }))
    user: UserEntity,
  ) {
    return user;
  }
}
