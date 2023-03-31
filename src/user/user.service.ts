import { PrismaService } from './../prisma.service';
import { UserDto } from './dto/user.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { returnUserObject } from './return-user-object';
import { Prisma } from '@prisma/client';
import { hash } from 'argon2';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async byId(id: number, selectObject: Prisma.UserSelect = {}) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...returnUserObject,
        favorites: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            slug: true,
          },
        },
        ...selectObject,
      },
    });

    if (!user) throw new Error('Пользователь не найден.');

    return user;
  }

  async update(id: number, dto: UserDto) {
    const isSameUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (isSameUser && id !== isSameUser.id)
      throw new BadRequestException('Почта занята.');

    const user = await this.byId(id);

    return this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        name: dto.name,
        avatarPath: dto.avatarPath,
        phone: dto.phone,
        password: dto.password ? await hash(dto.password) : user.password,
      },
    });
  }

  async toggleFavorite(userId: number, productId: number) {
    const user = await this.byId(userId);
    console.log(user, userId, productId, 'toggleFavorite');

    if (!user) throw new NotFoundException('Пользователь не найден.');

    const isExists = user.favorites.some((product) => product.id === productId);
    console.log(isExists);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        favorites: {
          [isExists ? 'disconnect' : 'connect']: {
            id: productId,
          },
        },
      },
    });

    return 'success';
  }
}
