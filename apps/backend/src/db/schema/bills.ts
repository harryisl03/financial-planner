import { pgTable, text, timestamp, varchar, uuid, decimal, boolean, integer } from 'drizzle-orm/pg-core';
import { users } from './auth.js';

export const bills = pgTable('bills', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    dueDate: integer('due_date').notNull(), // Day of month (1-31)
    category: varchar('category', { length: 50 }).notNull().default('Utilities'), // Utilities, Rent, Subscription, etc.
    isAutoPaid: boolean('is_auto_paid').default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
