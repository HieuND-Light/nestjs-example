import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '@src/prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './entities/user.entity';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let redis: any;

  const mockUserDto = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockUserRecord = {
    id: 1,
    ...mockUserDto,
    password: 'hashed_password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: getRedisConnectionToken('default'),
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<any>(getRedisConnectionToken('default'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create()', () => {
    // 1. Success Path
    it('should successfully hash the password and save the user', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      jest
        .spyOn(prisma.user, 'create')
        .mockResolvedValue(mockUserRecord as any);

      const result = await service.create(mockUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { ...mockUserDto, password: 'hashed_password' },
      });
      expect(result).toBeInstanceOf(UserEntity);
    });

    // 2. Conflict Path (Prisma Error P2002)
    it('should throw ConflictException if the email already exists', async () => {
      jest.spyOn(prisma.user, 'create').mockRejectedValue({
        code: 'P2002', // Prisma unique constraint violation
      });

      await expect(service.create(mockUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    // 3. Generic Error Path
    it('should rethrow unexpected database errors', async () => {
      jest
        .spyOn(prisma.user, 'create')
        .mockRejectedValue(new Error('DB Failure'));

      await expect(service.create(mockUserDto)).rejects.toThrow('DB Failure');
    });
  });

  describe('findOne()', () => {
    // 4. Success Path
    it('should return a UserEntity when a user is found by ID', async () => {
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValue(mockUserRecord as any);

      const result = await service.findOne(1);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toMatchObject({ email: 'test@example.com' });
      // Verify transformation logic
      expect(result).toBeInstanceOf(UserEntity);
    });

    // 5. Not Found Path
    it('should throw NotFoundException if no user is returned', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
