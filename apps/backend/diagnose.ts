import { db } from './src/db/index.js';
import { users } from './src/db/schema/auth.js';
import { userPreferences } from './src/db/schema/preferences.js';
import { transactions } from './src/db/schema/transactions.js';
import { eq } from 'drizzle-orm';

async function diagnose() {
    console.log('--- DIAGNOSTIC START ---');

    // 1. Get User
    const allUsers = await db.query.users.findMany();
    console.log(`Found ${allUsers.length} users.`);
    if (allUsers.length === 0) {
        console.log('No users found. Aborting.');
        process.exit(0);
    }
    const user = allUsers[0]; // Assume first user for now
    console.log(`Checking User: ${user.name} (${user.id})`);

    // 2. Check Preferences
    const prefs = await db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, user.id)
    });
    console.log('Preferences:', prefs || 'NONE FOUND');

    // 3. Check Transactions (Raw)
    const txs = await db.query.transactions.findMany({
        where: eq(transactions.userId, user.id)
    });
    console.log(`Found ${txs.length} total transactions.`);

    if (txs.length > 0) {
        console.log('Sample Transaction Date:', txs[0].date);
        console.log('Year of first tx:', new Date(txs[0].date).getFullYear());
    }

    console.log('--- DIAGNOSTIC END ---');
    process.exit(0);
}

diagnose().catch(console.error);
