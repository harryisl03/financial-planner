import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { subscriptions, invoices } from '../db/schema/subscriptions.js';
import { NotFoundError } from '../utils/errors.js';

export async function getSubscriptionByUserId(userId: string) {
    let subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
    });

    // Create free subscription if not exists
    if (!subscription) {
        [subscription] = await db
            .insert(subscriptions)
            .values({
                userId,
                plan: 'free',
                status: 'active',
            })
            .returning();
    }

    return subscription;
}

export async function upgradeSubscription(
    userId: string,
    plan: 'pro' | 'enterprise'
) {
    const subscription = await getSubscriptionByUserId(userId);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const [updated] = await db
        .update(subscriptions)
        .set({
            plan,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            updatedAt: now,
        })
        .where(eq(subscriptions.id, subscription.id))
        .returning();

    // Create invoice
    const amount = plan === 'pro' ? 29 : 99;
    await db.insert(invoices).values({
        subscriptionId: subscription.id,
        amount: amount.toString(),
        status: 'paid',
        paidAt: now,
    });

    return updated;
}

export async function downgradeSubscription(userId: string) {
    const subscription = await getSubscriptionByUserId(userId);

    const [updated] = await db
        .update(subscriptions)
        .set({
            plan: 'free',
            status: 'active',
            currentPeriodStart: null,
            currentPeriodEnd: null,
            updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id))
        .returning();

    return updated;
}

export async function cancelSubscription(userId: string) {
    const subscription = await getSubscriptionByUserId(userId);

    const [updated] = await db
        .update(subscriptions)
        .set({
            status: 'canceled',
            updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id))
        .returning();

    return updated;
}

export async function getInvoicesByUserId(userId: string) {
    const subscription = await getSubscriptionByUserId(userId);

    return db.query.invoices.findMany({
        where: eq(invoices.subscriptionId, subscription.id),
        orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
    });
}
