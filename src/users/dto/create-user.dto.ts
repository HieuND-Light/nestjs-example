import {
  IsEmail,
  IsString,
  MinLength,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  // @IsInt()
  // @Min(18)
  // @Max(100)
  // @Type(() => Number)
  // age!: number;
}
