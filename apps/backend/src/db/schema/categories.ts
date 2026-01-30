import {
    pgTable,
    text,
    timestamp,
    varchar,
    uuid,
    boolean,
    index,
} from 'drizzle-orm/pg-core';
import { users } from './auth';

export const categories = pgTable('categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }), // null = system default
    name: varchar('name', { length: 50 }).notNull(),
    type: varchar('type', { length: 10 }).notNull(), // income, expense
    icon: varchar('icon', { length: 50 }),
    color: varchar('color', { length: 7 }),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => {
    return {
        userIdIdx: index('category_user_id_idx').on(table.userId),
    };
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
