import { IsEmail, IsOptional, isString, IsString } from 'class-validator';

export class UserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  avatarPath: string;

  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  password: string;
}
