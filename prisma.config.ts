import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Use direct URL for schema operations (db push, migrate)
    // The pooler URL (DATABASE_URL) is for runtime queries in Next.js
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL']!,
  },
})
