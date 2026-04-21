import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatsModule } from './cats/cats.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, CatsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
