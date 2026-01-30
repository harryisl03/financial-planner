import {
    pgTable,
    text,
    timestamp,
    varchar,
    uuid,
    decimal,
} from 'drizzle-orm/pg-core';
import { users } from './auth';

export const subscriptions = pgTable('subscriptions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
        .notNull()
        .unique()
        .references(() => users.id, { onDelete: 'cascade' }),
    plan: varchar('plan', { length: 20 }).notNull().default('free'), // free, pro, enterprise
    status: varchar('status', { length: 20 }).notNull().default('active'), // active, canceled, past_due
    currentPeriodStart: timestamp('current_period_start'),
    currentPeriodEnd: timestamp('current_period_end'),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 100 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const invoices = pgTable('invoices', {
    id: uuid('id').primaryKey().defaultRandom(),
    subscriptionId: uuid('subscription_id')
        .notNull()
        .references(() => subscriptions.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // paid, pending, failed
    paidAt: timestamp('paid_at'),
    invoiceUrl: text('invoice_url'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
