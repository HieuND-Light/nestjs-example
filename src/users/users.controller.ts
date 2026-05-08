import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  Get,
  Param,
  Patch,
  UseGuards,
  Session,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { RolesGuard } from '@src/roles/roles.guard';
import { Roles } from '@src/roles/roles.decorator';
import { plainToInstance } from 'class-transformer';

@Controller('users')
@UseGuards(RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(['admin'])
  async findAll() {
    return this.usersService.findAll();
  }

  @SkipThrottle()
  @Get('health')
  checkHealth() {
    return { status: 'API endpoint always available.' };
  }

  @Get('profile')
  async getProfile(
    @Session() session: Record<string, any>,
  ): Promise<UserEntity> {
    if (!session.userId) {
      throw new UnauthorizedException(
        'No active session found. Please log in.',
      );
    }

    const user = await this.usersService.findOne(session.userId);

    return plainToInstance(UserEntity, user);
  }

  @Throttle({ short: { limit: 1, ttl: 1000 } })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserEntity> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDTO: UpdateUserDto) {
    return this.usersService.update(id, updateUserDTO);
  }
}
