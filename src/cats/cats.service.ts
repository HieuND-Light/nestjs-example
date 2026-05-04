import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { Cat, Prisma } from '@src/generated/prisma/client';

@Injectable()
export class CatsService {
  constructor(private prisma: PrismaService) {}

  async create(createCatDto: CreateCatDto) {
    await this.prisma.cat.create({ data: createCatDto });
    return `This action adds a new cat named ${createCatDto.name}`;
  }

  async findAll() {
    return await this.prisma.cat.findMany();
  }

  async findOne(id: number): Promise<Cat> {
    const cat = await this.prisma.cat.findUnique({ where: { id } });

    if (!cat) {
      throw new NotFoundException(`Cat with ID ${id} not found`);
    }
    return cat;
  }

  async update(id: number, data: UpdateCatDto): Promise<Cat> {
    try {
      return await this.prisma.cat.update({
        where: { id },
        data: data,
      });
    } catch (error) {
      console.log(error);
      throw new NotFoundException(`Cat with ID ${id} could not be updated`);
    }
  }

  async remove(id: number): Promise<Cat> {
    try {
      return await this.prisma.cat.delete({
        where: { id },
      });
    } catch (error) {
      console.log(error);
      throw new NotFoundException(
        `ID ${id} could not be deleted or does not exist.`,
      );
    }
  }

  async transaction(name: string) {
    return await this.prisma.$transaction(
      [
        this.prisma.cat.findMany({ where: { name: { contains: name } } }),
        this.prisma.cat.count(),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async advTransaction() {
    return this.prisma.$transaction(
      async (tx) => {
        const cat = await tx.cat.findMany({
          where: { name: { contains: 'Kitty' } },
        });
        const count = await tx.cat.count();
        return { cat, count };
      },
      {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async timeTest() {
    await this.prisma.$transaction(async (tx) => {
      await Promise.all([
        tx.cat.findMany(),
        tx.cat.findMany(),
        tx.cat.findMany(),
        tx.cat.findMany(),
        tx.cat.findMany(),
      ]);
    });
  }
}
