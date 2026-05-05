import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '@src/prisma/prisma.service';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';

describe('UsersController', () => {
  let controller: UsersController;
  let redis: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: getRedisConnectionToken('default'),
          useValue: {},
        },
      ],
      controllers: [UsersController],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    redis = module.get<any>(getRedisConnectionToken('default'));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
