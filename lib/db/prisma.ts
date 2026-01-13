import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const requireModule = (id: string) => {
  // eslint-disable-next-line no-eval
  const req = eval('require') as NodeRequire
  return req(id)
}

type PrismaClientInstance = any

const { Pool } = pg

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientInstance
  pool?: pg.Pool
}

const getPool = () => {
  if (globalForPrisma.pool) {
    return globalForPrisma.pool
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pool = pool
  }

  return pool
}

const getPrismaClient = () => {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const prismaClientModule = requireModule('@prisma/client') as {
    PrismaClient: new (options?: unknown) => unknown
  }
  const PrismaClient = prismaClientModule.PrismaClient

  const adapter = new PrismaPg(getPool())
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }) as PrismaClientInstance

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }

  return client
}

export const prisma = new Proxy({} as PrismaClientInstance, {
  get(_target, prop) {
    return (getPrismaClient() as any)[prop]
  },
}) as PrismaClientInstance
