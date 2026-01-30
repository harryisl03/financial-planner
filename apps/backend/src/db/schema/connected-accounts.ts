import {
    pgTable,
    text,
    timestamp,
    varchar,
    uuid,
    jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './auth';

export const connectedAccounts = pgTable('connected_accounts', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull(), // "bca", "gopay", "stripe"
    providerAccountId: varchar('provider_account_id', { length: 100 }),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // synced, error, pending
    lastSyncedAt: timestamp('last_synced_at'),
    metadata: jsonb('metadata'), // Provider-specific data
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type ConnectedAccount = typeof connectedAccounts.$inferSelect;
export type NewConnectedAccount = typeof connectedAccounts.$inferInsert;
