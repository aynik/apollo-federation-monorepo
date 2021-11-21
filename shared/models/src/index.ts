import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface ModelsContext {
  prisma: PrismaClient
}

export function createModelsContext(context: object): ModelsContext {
  return {
    ...context,
    prisma,
  }
}
