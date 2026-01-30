import { pgTable, text, timestamp, varchar, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth';

export const userPreferences = pgTable('user_preferences', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
        .notNull()
        .unique()
        .references(() => users.id, { onDelete: 'cascade' }),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    language: varchar('language', { length: 5 }).notNull().default('en'),
    theme: varchar('theme', { length: 10 }).notNull().default('dark'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
