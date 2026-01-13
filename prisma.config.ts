import { config } from 'dotenv'
import { defineConfig, env } from 'prisma/config'

// Load local env file for Prisma CLI
config({ path: '.env.local' })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
