import {
    pgTable,
    text,
    timestamp,
    varchar,
    uuid,
    decimal,
    boolean,
} from 'drizzle-orm/pg-core';
import { users } from './auth';

export const financialAccounts = pgTable('financial_accounts', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(), // bank, ewallet, cash, credit_card
    balance: decimal('balance', { precision: 15, scale: 2 }).notNull().default('0'),
    accountNumber: varchar('account_number', { length: 50 }), // Masked: **** 4532
    icon: varchar('icon', { length: 50 }),
    color: varchar('color', { length: 7 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type NewFinancialAccount = typeof financialAccounts.$inferInsert;
