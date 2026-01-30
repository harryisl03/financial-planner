import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema/index.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
});
