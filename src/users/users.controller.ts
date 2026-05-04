import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
  Get,
  Param,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserEntity> {
    return this.usersService.findOne(id);
  }
}
