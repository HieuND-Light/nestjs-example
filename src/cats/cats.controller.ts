import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  BadRequestException,
  UseFilters,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { CatsService } from './cats.service';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { HttpExceptionFilter } from 'src/http-exception/http-exception.filter';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/roles/roles.guard';
import { Roles } from 'src/roles/roles.decorator';
import { LoggingInterceptor } from 'src/logger/logging.interceptor';
import { TransformInterceptor } from 'src/logger/transform.interceptor';

@Controller('cats')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Post()
  @Roles(['admin'])
  create(@Body() createCatDto: CreateCatDto) {
    return this.catsService.create(createCatDto);
  }

  @Get()
  findAll() {
    try {
      return this.catsService.findAll();
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'This is a custom message',
        },
        HttpStatus.FORBIDDEN,
        {
          cause: error,
        },
      );
    }
  }

  @Get('abcd/*path')
  wildcards() {
    return 'This route uses a wildcard';
  }

  @Get('/400')
  @UseFilters(HttpExceptionFilter)
  throw400() {
    throw new BadRequestException('Something bad happened', {
      cause: new Error(),
      description: 'Detailed error description.',
    });
  }

  @Get('/tx1')
  count(@Query('name') name: string) {
    return this.catsService.transaction(name);
  }

  @Get('/tx2')
  count2() {
    return this.catsService.advTransaction();
  }
  @Get('/txpromise')
  test() {
    return this.catsService.testTime();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.catsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCatDto: UpdateCatDto,
  ) {
    return this.catsService.update(id, updateCatDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catsService.remove(id);
  }
}
