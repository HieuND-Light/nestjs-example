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
import { Prisma } from '@src/generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async findAll() {
    const allUser = await this.prisma.user.findMany();
    if (!allUser) {
      throw new NotFoundException(`No users available`);
    }
    return allUser.map((user) => plainToInstance(UserEntity, user));
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
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async findOne(id: string): Promise<UserEntity> {
    const cacheKey = `user:${id}`;
    try {
      const cachedUser = await this.redis.get(cacheKey);
      if (cachedUser) {
        const parsedUser = JSON.parse(cachedUser) as UserEntity;
        return plainToInstance(UserEntity, parsedUser);
      }
    } catch (error) {}

    const userRecord = await this.prisma.user.findUnique({ where: { id } });
    if (!userRecord) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    try {
      await this.redis.set(cacheKey, JSON.stringify(userRecord), 'EX', 3600);
    } catch (error) {}

    return plainToInstance(UserEntity, userRecord);
  }

  async update(id: string, data: UpdateUserDto): Promise<UserEntity> {
    let updatedUser: UpdateUserDto;
    try {
      updatedUser = await this.prisma.user.update({
        where: { id },
        data: data,
      });
    } catch {
      throw new NotFoundException(`User with ID ${id} could not be updated`);
    }

    try {
      await this.redis.del(`user:${id}`);
    } catch (error) {}

    return plainToInstance(UserEntity, updatedUser);
  }
}
