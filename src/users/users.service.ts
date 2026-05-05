import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

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

  async findOne(id: string): Promise<UserEntity> {
    const cacheKey = `user:${id}`;
    const cachedUser = await this.redis.get(cacheKey);
    if (cachedUser) {
      const oneUser = JSON.parse(cachedUser);
      return plainToInstance(UserEntity, oneUser);
    }

    const userRecord = await this.prisma.user.findUnique({ where: { id } });
    if (!userRecord) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.redis.set(cacheKey, JSON.stringify(userRecord), 'EX', 3600);

    return plainToInstance(UserEntity, userRecord);
  }

  async update(id: string, data: UpdateUserDto): Promise<UserEntity> {
    let updatedUser: Partial<UserEntity>;
    try {
      updatedUser = await this.prisma.user.update({
        where: { id },
        data: data,
      });
    } catch {
      throw new NotFoundException(`User with ID ${id} could not be updated`);
    }

    await this.redis.del(`user:${id}`);

    return plainToInstance(UserEntity, updatedUser);
  }
}
