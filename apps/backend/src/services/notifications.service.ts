import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { notifications } from '../db/schema/notifications.js';

export async function getNotifications(userId: string) {
    return db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(20);
}

export async function getUnreadCount(userId: string) {
    const result = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
            and(
                eq(notifications.userId, userId),
                eq(notifications.isRead, false)
            )
        );
    return result.length;
}

export async function markAsRead(notificationId: string, userId: string) {
    return db
        .update(notifications)
        .set({ isRead: true })
        .where(
            and(
                eq(notifications.id, notificationId),
                eq(notifications.userId, userId)
            )
        )
        .returning();
}

export async function markAllAsRead(userId: string) {
    return db
        .update(notifications)
        .set({ isRead: true })
        .where(
            and(
                eq(notifications.userId, userId),
                eq(notifications.isRead, false)
            )
        )
        .returning();
}

export async function createNotification(
    userId: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'system',
    title: string,
    message: string,
    link?: string
) {
    return db
        .insert(notifications)
        .values({
            userId,
            type,
            title,
            message,
            link,
        })
        .returning();
}
