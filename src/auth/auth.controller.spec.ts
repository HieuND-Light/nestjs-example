import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '@src/users/users.service';
import { PrismaService } from '@src/prisma/prisma.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {},
        },
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: JwtRefreshGuard,
          useValue: {},
        },
      ],
      controllers: [AuthController],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
