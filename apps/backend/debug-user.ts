import { db } from './src/db/index.js';
import { users } from './src/db/schema/auth.js';
import { randomUUID } from 'crypto';

async function main() {
    console.log('Testing User Creation...');
    try {
        const id = randomUUID();
        console.log(`Attempting to insert user with ID: ${id}`);

        await db.insert(users).values({
            id: id,
            name: 'Debug User',
            email: `debug-${id}@example.com`,
            emailVerified: true,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('✅ User created successfully!');

        // Cleanup
        // await db.delete(users).where(eq(users.id, id));
    } catch (error) {
        console.error('❌ Failed to create user:', error);
    }
    process.exit(0);
}

main();
