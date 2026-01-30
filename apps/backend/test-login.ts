
import { auth } from './src/auth/index.js';
import { db } from './src/db/index.js';
import { users } from './src/db/schema/auth.js';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('--- TEST LOGIN START ---');
    const testEmail = 'test-login-user@example.com';
    const testPassword = 'password123456';
    const testName = 'Test Login User';

    try {
        // 1. Cleanup existing test user
        const existingUsers = await db.select().from(users).where(eq(users.email, testEmail));
        if (existingUsers.length > 0) {
            console.log(`Found ${existingUsers.length} existing users. Deleting...`);
            for (const u of existingUsers) {
                await db.delete(users).where(eq(users.id, u.id));
            }
            console.log('Deleted existing users.');
        }

        console.log('1. Attempting Sign Up...');
        const signUpRes = await auth.api.signUpEmail({
            body: {
                email: testEmail,
                password: testPassword,
                name: testName
            }
        });
        console.log('✅ Sign Up Successful:', signUpRes.user.email);

        console.log('2. Attempting Sign In...');
        const signInRes = await auth.api.signInEmail({
            body: {
                email: testEmail,
                password: testPassword
            }
        });

        if (signInRes.session) {
            console.log('✅ Sign In Successful!');
            console.log('Session Token:', signInRes.session.token);
        } else {
            console.error('❌ Sign In Failed: No session returned. Response:', signInRes);
        }

    } catch (error) {
        console.error('❌ CRITICAL ERROR:', error);
    }
    process.exit(0);
}

main();
