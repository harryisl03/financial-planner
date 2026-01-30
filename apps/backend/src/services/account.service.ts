import { eq, sql, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { financialAccounts } from '../db/schema/accounts.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import type { NewFinancialAccount } from '../db/schema/accounts.js';

export async function getAccountsByUserId(userId: string) {
    return db.query.financialAccounts.findMany({
        where: eq(financialAccounts.userId, userId),
        orderBy: financialAccounts.createdAt,
    });
}

export async function getAccountById(userId: string, accountId: string) {
    const account = await db.query.financialAccounts.findFirst({
        where: and(
            eq(financialAccounts.id, accountId),
            eq(financialAccounts.userId, userId)
        ),
    });

    if (!account) {
        throw new NotFoundError('Account');
    }

    return account;
}

export async function createAccount(
    userId: string,
    data: Omit<NewFinancialAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
) {
    const [account] = await db
        .insert(financialAccounts)
        .values({
            ...data,
            userId,
            balance: data.balance?.toString() || '0',
        })
        .returning();

    return account;
}

export async function updateAccount(
    userId: string,
    accountId: string,
    data: Partial<Omit<NewFinancialAccount, 'id' | 'userId' | 'createdAt'>>
) {
    // Verify ownership
    await getAccountById(userId, accountId);

    const [updated] = await db
        .update(financialAccounts)
        .set({
            ...data,
            balance: data.balance?.toString(),
            updatedAt: new Date(),
        })
        .where(eq(financialAccounts.id, accountId))
        .returning();

    return updated;
}

export async function deleteAccount(userId: string, accountId: string) {
    // Verify ownership
    await getAccountById(userId, accountId);

    await db.delete(financialAccounts).where(eq(financialAccounts.id, accountId));
}

export async function getTotalBalance(userId: string) {
    const result = await db
        .select({
            total: sql<string>`COALESCE(SUM(${financialAccounts.balance}), 0)`,
        })
        .from(financialAccounts)
        .where(
            and(
                eq(financialAccounts.userId, userId),
                eq(financialAccounts.isActive, true)
            )
        );

    return parseFloat(result[0]?.total || '0');
}
