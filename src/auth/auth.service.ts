import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async getTokens(userId: string, email: string) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: process.env.JWT_SECRET_KEY,
          expiresIn: process.env.JWT_EXPIRATION as any,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: process.env.JWT_REFRESH_EXPIRATION as any,
        },
      ),
    ]);

    return { access_token: access_token, refresh_token: refresh_token };
  }

  async updateRefreshToken(userId: string, refresh_token: string) {
    const hash = await bcrypt.hash(refresh_token, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: hash },
    });
  }

  async refreshTokens(userId: string, refresh_token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.hashedRefreshToken)
      throw new UnauthorizedException('Access Denied');

    const rtMatches = await bcrypt.compare(
      refresh_token,
      user.hashedRefreshToken,
    );
    if (!rtMatches) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { hashedRefreshToken: null },
      });
      throw new UnauthorizedException(
        'Something goes wrong. Please login again.',
      );
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async validateUser(dto: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    const passwordToCompare =
      user?.password ?? '$2b$10$invalidhashtofooltimingattacks';
    const passwordMatches = await bcrypt.compare(
      dto.password,
      passwordToCompare,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException(`Invalid credentials`);
    }

    return user;
  }

  async signOut(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
    return 'Log out successful';
  }
}
