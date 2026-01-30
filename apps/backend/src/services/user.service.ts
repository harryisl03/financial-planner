import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { userPreferences } from '../db/schema/preferences.js';
import { users, authAccounts } from '../db/schema/auth.js';
import { NotFoundError } from '../utils/errors.js';

import { subscriptions } from '../db/schema/subscriptions.js';

export async function getUserById(userId: string) {
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user) {
        throw new NotFoundError('User');
    }

    // Fetch subscription manually since relation might not be set up in auth schema
    const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
    });

    // Check for password
    // const accounts = await db.select().from(authAccounts).where(eq(authAccounts.userId, userId));
    // const hasPassword = accounts.some(acc => acc.providerId === 'credential' || !!acc.password);

    return {
        ...user,
        // hasPassword,
        subscription: subscription || { plan: 'free', status: 'active' },
    };
}

export async function updateUserProfile(
    userId: string,
    data: { name?: string; image?: string }
) {
    const [updated] = await db
        .update(users)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

    return updated;
}

export async function getUserPreferences(userId: string) {
    let preferences = await db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, userId),
    });

    // Create default preferences if not exists
    if (!preferences) {
        [preferences] = await db
            .insert(userPreferences)
            .values({ userId })
            .returning();
    }

    return preferences;
}

export async function updateUserPreferences(
    userId: string,
    data: { currency?: string; language?: string; theme?: string }
) {
    // Ensure preferences exist
    await getUserPreferences(userId);

    const [updated] = await db
        .update(userPreferences)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, userId))
        .returning();

    return updated;
}

export async function deleteUser(userId: string) {
    // Delete user from database
    // Configure cascade in schema handles related data (sessions, accounts, etc.)
    const [deleted] = await db
        .delete(users)
        .where(eq(users.id, userId))
        .returning();

    return deleted;
}
