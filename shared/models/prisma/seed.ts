import { PrismaClient } from '@prisma/client'
import users from './seeds/users'
import products from './seeds/products'
import productVariants from './seeds/productVariants'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.createMany({
    data: users,
  })
  for (const user of await prisma.user.findMany()) {
    await prisma.product.createMany({
      data: products.map((product) => ({
        ...product,
        createdById: user.id,
      })),
    })
  }
  for (const product of await prisma.product.findMany()) {
    await prisma.productVariant.createMany({
      data: productVariants.map((productVariant) => ({
        ...productVariant,
        productId: product.id,
      })),
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
