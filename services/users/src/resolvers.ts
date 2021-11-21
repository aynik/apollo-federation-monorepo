import { subDays } from 'date-fns'
import { ModelsContext } from '@shared/models'
import { hashPassword, signJwt, JwtContext } from '@shared/crypto'
import { shield, isUser, isAuthenticated } from '@shared/access'
import { Resolvers } from './types/graphql'

export const permissions = shield(
  {
    Mutation: {
      getToken: isAuthenticated,
    },
    Query: {
      me: isUser,
    },
  },
  { allowExternalErrors: true },
)

export const resolvers: Resolvers<ModelsContext & JwtContext> = {
  Mutation: {
    async createUser(_reference, { input }, { prisma }) {
      return prisma.user.create({
        data: {
          ...input,
          password: await hashPassword(input.password),
        },
      })
    },
    async getToken(_reference, { input }, { prisma, refreshId }) {
      try {
        let user
        if (!input) {
          if (refreshId) {
            user = await prisma.refreshToken
              .findUnique({
                where: { id: refreshId },
              })
              .user()
            await prisma.refreshToken.delete({
              where: { id: refreshId },
            })
          } else {
            throw new Error('Unauthorized')
          }
        } else {
          user = await prisma.user.findUnique({
            where: { email: input.email },
          })
        }
        if (user) {
          const refreshToken = await prisma.refreshToken.create({
            data: {
              userId: user.id,
            },
          })
          return {
            token: signJwt({ userId: user.id }, '1d'),
            refreshToken: signJwt(
              { userId: user.id, refreshId: refreshToken.id },
              '7d',
            ),
          }
        }
        return null
      } finally {
        prisma.refreshToken.deleteMany({
          where: {
            createdAt: { lt: subDays(new Date(), 7) },
          },
        })
      }
    },
  },
  Query: {
    me(_reference, _args, { prisma, userId }) {
      return prisma.user.findUnique({
        where: { id: userId },
      })
    },
  },
  User: {
    __resolveReference: ({ id }, { prisma }) => {
      return prisma.user.findUnique({ where: { id } })
    },
  },
  Product: {
    createdBy: ({ id }, _args, { prisma }) => {
      return prisma.user.findFirst({
        where: { products: { some: { id } } },
      })
    },
  },
}
