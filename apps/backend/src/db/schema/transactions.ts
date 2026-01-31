import {
    pgTable,
    text,
    timestamp,
    varchar,
    uuid,
    decimal,
    index,
} from 'drizzle-orm/pg-core';
import { users } from './auth.js';
import { financialAccounts } from './accounts.js';
import { categories } from './categories.js';

export const transactions = pgTable('transactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
        .notNull()
        .references(() => financialAccounts.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
        .notNull()
        .references(() => categories.id, { onDelete: 'restrict' }),
    type: varchar('type', { length: 10 }).notNull(), // income, expense, transfer
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    description: varchar('description', { length: 255 }).notNull(),
    date: timestamp('date').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
    return {
        // userIdIdx: index('user_id_idx').on(table.userId), // Replaced by composite
        // dateIdx: index('date_idx').on(table.date), // Replaced by composite or kept for global date queries? usually we filter by user first.
        // Let's keep date separate if we do global analytics, but likely not.
        // Composite index is key for dashboard.
        userDateIdx: index('user_date_idx').on(table.userId, table.date),
        accountIdIdx: index('account_id_idx').on(table.accountId),
        categoryIdIdx: index('category_id_idx').on(table.categoryId),
    };
});

import { relations } from 'drizzle-orm';

export const transactionsRelations = relations(transactions, ({ one }) => ({
    user: one(users, {
        fields: [transactions.userId],
        references: [users.id],
    }),
    account: one(financialAccounts, {
        fields: [transactions.accountId],
        references: [financialAccounts.id],
    }),
    category: one(categories, {
        fields: [transactions.categoryId],
        references: [categories.id],
    }),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
