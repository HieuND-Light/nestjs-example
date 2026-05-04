import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@src/prisma/prisma.service';
import { UsersService } from '@src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    hashedRefreshToken: 'hashedRT',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {}, // Not directly used in the snippets provided
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mocked_token'),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    // Test 1: Success Scenario
    it('should return user when credentials are valid', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockUser);
    });

    // Test 2: Failure Scenario (Wrong Password)
    it('should throw UnauthorizedException when password does not match', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser({
          email: 'test@example.com',
          password: 'wrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    // Test 3: Success Scenario for Refresh
    it('should return new tokens if refresh token matches', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedRT');

      const result = await service.refreshTokens(1, 'valid_rt');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(prisma.user.update).toHaveBeenCalled();
    });

    // Test 4: Security Scenario (Token Mismatch)
    it('should clear hashedRefreshToken and throw if RT does not match', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshTokens(1, 'invalid_rt')).rejects.toThrow(
        'Something goes wrong. Please login again.',
      );

      // Verification that the token was cleared in DB for security
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { hashedRefreshToken: null },
      });
    });
  });

  describe('signOut', () => {
    // Test 5: Sign Out Logic
    it('should clear the refresh token on sign out', async () => {
      const updateSpy = jest
        .spyOn(prisma.user, 'update')
        .mockResolvedValue({} as any);

      const result = await service.signOut(1);

      expect(result).toBe('Log out successful');
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { hashedRefreshToken: null },
      });
    });
  });
});
