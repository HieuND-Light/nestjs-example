import { Exclude, Expose, Transform } from 'class-transformer';

export class UserEntity {
  id!: string;
  firstName?: string;
  lastName?: string;

  @Transform(({ value }) => value.toLowerCase().trim())
  email!: string;

  @Exclude()
  password!: string;

  @Expose()
  get fullName(): string {
    if (!this.firstName || !this.lastName) return '';
    return `${this.firstName} ${this.lastName}`;
  }

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
