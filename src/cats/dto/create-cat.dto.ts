import { IsString, IsInt, MinLength, IsPositive } from 'class-validator';

export class CreateCatDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsInt()
  @IsPositive()
  age!: number;

  @IsString()
  breed!: string;
}
