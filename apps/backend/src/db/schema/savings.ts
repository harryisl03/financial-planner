import { pgTable, text, timestamp, uuid, decimal } from 'drizzle-orm/pg-core';
import { users } from './auth.js';

export const savingsGoals = pgTable('savings_goals', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    targetAmount: decimal('target_amount', { precision: 12, scale: 2 }).notNull(),
    currentAmount: decimal('current_amount', { precision: 12, scale: 2 }).default('0').notNull(),
    color: text('color').default('emerald'), // emerald, blue, rose, amber, etc.
    deadline: timestamp('deadline'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
