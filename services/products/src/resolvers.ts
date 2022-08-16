import { ModelsContext } from '@shared/models'
import { JwtContext } from '@shared/crypto'
import { shield, isUser } from '@shared/access'
import { Resolvers } from './types/graphql'

export const permissions = shield(
  {
    Query: {
      myProducts: isUser,
    },
  },
  { allowExternalErrors: true },
)

export const resolvers: Resolvers<ModelsContext & JwtContext> = {
  Query: {
    allProducts: (_parent, _args, { prisma }) => {
      return prisma.product.findMany()
    },
    myProducts: (_parent, _args, { prisma, userId }) => {
      return userId
        ? prisma.user.findUnique({ where: { id: userId } }).products()
        : null
    },
    product: (_, { id }, { prisma }) => {
      return prisma.product.findUnique({ where: { id } })
    },
  },
  Product: {
    variants: ({ id }, _args, { prisma }) => {
      return prisma.product.findUnique({ where: { id } }).variants()
    },
    __resolveReference: ({ id }, { prisma }) => {
      return prisma.product.findUnique({ where: { id } })
    },
  },
  ProductVariant: {
    __resolveReference: ({ id }, { prisma }) => {
      return prisma.productVariant.findUnique({ where: { id } })
    },
  },
  User: {
    productsCreated: ({ id }, _args, { prisma }) => {
      return prisma.user.findUnique({ where: { id } }).products()
    },
  },
  MutatingUser: {
    withProduct: ({ id }, { input: { name, sku } }, { prisma }) => {
      return prisma.product.create({
        data: {
          name,
          sku,
          createdById: id,
        },
      })
    },
  },
}
