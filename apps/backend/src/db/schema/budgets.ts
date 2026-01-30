import {
    pgTable,
    text,
    timestamp,
    varchar,
    uuid,
    decimal,
    date,
    index,
} from 'drizzle-orm/pg-core';
import { users } from './auth';
import { categories } from './categories';

export const budgets = pgTable('budgets', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
        .notNull()
        .references(() => categories.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    periodType: varchar('period_type', { length: 10 }).notNull().default('monthly'), // monthly, yearly
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
    return {
        userIdIdx: index('budget_user_id_idx').on(table.userId),
        categoryIdIdx: index('budget_category_id_idx').on(table.categoryId),
    };
});

import { relations } from 'drizzle-orm';

export const budgetsRelations = relations(budgets, ({ one }) => ({
    user: one(users, {
        fields: [budgets.userId],
        references: [users.id],
    }),
    category: one(categories, {
        fields: [budgets.categoryId],
        references: [categories.id],
    }),
}));

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
