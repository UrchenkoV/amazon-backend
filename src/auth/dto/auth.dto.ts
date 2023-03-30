import {
  IsEmail,
  MinLength,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class AuthDto {
  @IsEmail({}, { message: 'Укажите правильную почту.' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Имя должно быть строкой.' })
  @MaxLength(50, { message: 'Имя Не более 50-ти символов.' })
  name: string;

  @MinLength(6, { message: 'Пароль не менее 6-ти символов.' })
  @IsString({ message: 'Пароль должнен быть строкой.' })
  password: string;
}
