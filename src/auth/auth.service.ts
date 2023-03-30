import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthDto } from './dto/auth.dto';
import { PrismaService } from './../prisma.service';
import { Injectable } from '@nestjs/common';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common/exceptions';
import { hash, verify } from 'argon2';
import { faker } from '@faker-js/faker';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: AuthDto) {
    console.log(dto, 'dto');

    // Получение пользователя
    const oldUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    console.log(oldUser, 'old user');

    // Если пользователь с такой почтой существует, сообщаем об этом.
    if (oldUser)
      throw new BadRequestException(
        'Пользователь с такой почтой уже существует.',
      );

    // Если пользователя с такой почтой нет, создаём его.
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        avatarPath: faker.image.avatar(),
        phone: faker.phone.number('+7 (###) ###-##-##'),
        password: await hash(dto.password),
      },
    });

    // Генерируем токены
    const tokens = await this.issueTokens(user.id);

    // Возвращаем ответ.
    return { user: this.returnUserFields(user), ...tokens };
  }

  async login(dto: AuthDto) {
    const user = await this.validateUser(dto);

    const tokens = await this.issueTokens(user.id);

    return {
      user: this.returnUserFields(user),
      ...tokens,
    };
  }

  async getNewTokens(refreshToken: string) {
    const result = await this.jwt.verifyAsync(refreshToken);

    if (!result) throw new UnauthorizedException('Неверный refresh token.');

    const user = await this.prisma.user.findUnique({
      where: { id: result.id },
    });

    const tokens = await this.issueTokens(user.id);

    return {
      user: this.returnUserFields(user),
      ...tokens,
    };
  }

  /**
   * Генерируем токены.
   * @param userId
   * @returns
   */
  private async issueTokens(userId: number) {
    const data = { id: userId };

    const accessToken = this.jwt.sign(data, {
      expiresIn: '1h',
    });

    const refreshToken = this.jwt.sign(data, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  /**
   * Указываем какие данные возвращать.
   * @param user
   * @returns
   */
  private returnUserFields(user: User) {
    return {
      id: user.id,
      email: user.email,
    };
  }

  private async validateUser(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new NotFoundException('Пользователь не найден.');

    const isValid = await verify(user.password, dto.password);

    if (!isValid) throw new UnauthorizedException('Неверная почта или пароль.');

    return user;
  }
}
