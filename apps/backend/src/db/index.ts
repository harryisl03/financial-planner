import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';

import * as auth from './schema/auth.js';
import * as accounts from './schema/accounts.js';
import * as categories from './schema/categories.js';
import * as transactions from './schema/transactions.js';
import * as notifications from './schema/notifications.js';
import * as budgets from './schema/budgets.js';
import * as subscriptions from './schema/subscriptions.js';
import * as preferences from './schema/preferences.js';
import * as savings from './schema/savings.js';
import * as bills from './schema/bills.js';

const schema = {
    ...auth,
    ...accounts,
    ...categories,
    ...transactions,
    ...notifications,
    ...budgets,
    ...subscriptions,
    ...preferences,
    ...savings,
    ...bills
};

const connectionString = process.env.DATABASE_URL!;

// For query purposes
const queryClient = postgres(connectionString, {
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
export const db = drizzle(queryClient, { schema });

// Export schema for use in other files
export { schema };
export * from './schema/auth.js';
export * from './schema/accounts.js';
export * from './schema/categories.js';
export * from './schema/transactions.js';
export * from './schema/notifications.js';
export * from './schema/budgets.js';
export * from './schema/subscriptions.js';
export * from './schema/preferences.js';
export * from './schema/savings.js';
export * from './schema/bills.js';
