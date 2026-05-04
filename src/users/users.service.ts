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

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
    const userRecord = await this.prisma.user.findUnique({ where: { id } });
    if (!userRecord) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return plainToInstance(UserEntity, userRecord);
  }
}
