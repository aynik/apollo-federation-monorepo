import { ModelsContext } from '@shared/models'
import { JwtContext, comparePassword } from '@shared/crypto'
import { shield, rule } from 'graphql-shield'

export { shield }

export const isUser = rule({ cache: 'contextual' })(
  async (
    _parent,
    _args,
    { prisma, userId, refreshId }: JwtContext & ModelsContext,
  ) => {
    if (refreshId) {
      return new Error('Unexpected refresh token')
    }
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        return new Error('Unauthorized')
      }
      return true
    }
    return false
  },
)

export const isAuthenticated = rule({ cache: 'no_cache' })(
  async (
    _parent,
    { input },
    { prisma, refreshId }: JwtContext & ModelsContext,
  ) => {
    if (refreshId) {
      const refreshToken = await prisma.refreshToken.findUnique({
        where: { id: refreshId },
      })
      if (!refreshToken) {
        return new Error('Unauthorized')
      }
      return true
    }
    if (input) {
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      })
      if (!user || !comparePassword(input.password, user.password)) {
        return new Error('Unauthenticated')
      }
      return true
    }
    return false
  },
)
