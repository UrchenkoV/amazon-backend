import { faker } from '@faker-js/faker';
import { PrismaClient, Product } from '@prisma/client';
import * as dotenv from 'dotenv';
import slugify from 'slugify';

dotenv.config();
const prisma = new PrismaClient();

const createProducts = async (quantity: number) => {
  faker.setLocale('ru');

  const products: Product[] = [];

  for (let i = 0; i < quantity; i++) {
    const productName = faker.commerce.productName();
    const categoryName = faker.commerce.department();

    const product = await prisma.product.create({
      data: {
        title: productName,
        slug: slugify(productName, { locale: 'ru', lower: true }),
        description: faker.commerce.productDescription(),
        price: +faker.commerce.price(350, 9900, 0),
        images: Array.from({
          length: faker.datatype.number({ min: 2, max: 7 }),
        }).map(() => faker.image.imageUrl()),

        category: {
          create: {
            title: categoryName,
            slug: slugify(categoryName, { locale: 'ru', lower: true }),
          },
        },
        reviews: {
          create: [
            {
              rating: faker.datatype.number({ min: 1, max: 5 }),
              text: faker.lorem.paragraph(),
              user: {
                connect: { id: 1 },
              },
            },
            {
              rating: faker.datatype.number({ min: 1, max: 5 }),
              text: faker.lorem.paragraph(),
              user: {
                connect: { id: 1 },
              },
            },
          ],
        },
      },
    });

    products.push(product);
  }

  console.log(`Создано ${products.length} продуктов.`);
};

async function main() {
  console.log('Start seeding...');
  await createProducts(10);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
