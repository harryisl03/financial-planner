
import { db } from '../db/index.js';
import { transactions } from '../db/schema/transactions.js';
import { budgets } from '../db/schema/budgets.js';
import { savingsGoals } from '../db/schema/savings.js';
import { notifications } from '../db/schema/notifications.js';
import { connectedAccounts } from '../db/schema/connected-accounts.js';
import { sql } from 'drizzle-orm';

async function resetData() {
    console.log('🗑️  Clearing database data...');

    try {
        // Delete in order to avoid FK constraints if any (though usually delete cascade handles it, explicit is safer in app code)

        console.log('Removing transactions...');
        try { await db.delete(transactions); } catch (e: any) { console.warn('Failed to clear transactions (might not exist):', e.message); }

        console.log('Removing budgets...');
        try { await db.delete(budgets); } catch (e: any) { console.warn('Failed to clear budgets (might not exist):', e.message); }

        console.log('Removing savings goals...');
        try { await db.delete(savingsGoals); } catch (e: any) { console.warn('Failed to clear savings goals (might not exist):', e.message); }

        console.log('Removing notifications...');
        try { await db.delete(notifications); } catch (e: any) { console.warn('Failed to clear notifications (might not exist):', e.message); }

        console.log('Removing connected accounts...');
        try { await db.delete(connectedAccounts); } catch (e: any) { console.warn('Failed to clear connected accounts (might not exist):', e.message); }

        console.log('✅ Data cleared successfully!');
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error clearing data:', error);
        process.exit(1);
    }
}

resetData();
