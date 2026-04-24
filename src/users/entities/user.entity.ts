import { Exclude, Expose, Transform } from 'class-transformer';

export class UserEntity {
  id!: number;
  firstName?: string;
  lastName?: string;

  @Transform(({ value }) => value.toLowerCase().trim())
  email!: string;

  @Exclude()
  password!: string;

  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
