import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

// Example: This should be a real class/interface representing a user entity
export type User = any;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private readonly users = [
    {
      userId: 1,
      username: 'alice',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'bob',
      password: 'guess',
    },
  ];

  async findOneTest(username: string): Promise<User | undefined> {
    return await this.users.find((user) => user.username === username);
  }

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    try {
      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
      });
      return new UserEntity(user);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async findOne(id: number): Promise<UserEntity> {
    const user = (await this.prisma.user.findUnique({
      where: { id },
    })) as UserEntity;
    return new UserEntity(user);
  }
}
