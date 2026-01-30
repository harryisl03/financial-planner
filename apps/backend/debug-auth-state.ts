
import { db } from './src/db/index.js';
import { users, authAccounts } from './src/db/schema/auth.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';

async function main() {
    const output = [];
    try {
        const allUsers = await db.select().from(users);

        for (const user of allUsers) {
            const accounts = await db.select().from(authAccounts).where(eq(authAccounts.userId, user.id));
            output.push({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    twoFactorEnabled: user.twoFactorEnabled
                },
                accounts: accounts.map(acc => ({
                    providerId: acc.providerId,
                    hasPassword: !!acc.password
                }))
            });
        }
        fs.writeFileSync('debug-auth-output.json', JSON.stringify(output, null, 2));
        console.log('Written to debug-auth-output.json');

    } catch (error) {
        console.error('Error fetching users:', error);
    }
    process.exit(0);
}

main();
