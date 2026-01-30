import { eq, and, gte, lte, ilike, sql, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { transactions } from '../db/schema/transactions.js';
import { financialAccounts } from '../db/schema/accounts.js';
import { categories } from '../db/schema/categories.js';
import { NotFoundError } from '../utils/errors.js';
import type { NewTransaction } from '../db/schema/transactions.js';

interface TransactionFilters {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    accountId?: string;
    type?: 'income' | 'expense' | 'transfer';
    minAmount?: number;
    maxAmount?: number;
    search?: string;
}

export async function getTransactionsByUserId(
    userId: string,
    filters: TransactionFilters = {}
) {
    const {
        page = 1,
        limit = 20,
        startDate,
        endDate,
        categoryId,
        accountId,
        type,
        minAmount,
        maxAmount,
        search,
    } = filters;

    const conditions = [eq(transactions.userId, userId)];

    if (startDate) {
        conditions.push(gte(transactions.date, new Date(startDate)));
    }
    if (endDate) {
        conditions.push(lte(transactions.date, new Date(endDate)));
    }
    if (categoryId) {
        conditions.push(eq(transactions.categoryId, categoryId));
    }
    if (accountId) {
        conditions.push(eq(transactions.accountId, accountId));
    }
    if (type) {
        conditions.push(eq(transactions.type, type));
    }
    if (minAmount !== undefined) {
        conditions.push(gte(transactions.amount, minAmount.toString()));
    }
    if (maxAmount !== undefined) {
        conditions.push(lte(transactions.amount, maxAmount.toString()));
    }
    if (search) {
        conditions.push(ilike(transactions.description, `%${search}%`));
    }

    const offset = (page - 1) * limit;

    const [data, countResult] = await Promise.all([
        db.query.transactions.findMany({
            where: and(...conditions),
            with: {
                category: true,
                account: true,
            },
            orderBy: desc(transactions.date),
            limit,
            offset,
        }),
        db
            .select({ count: sql<number>`count(*)` })
            .from(transactions)
            .where(and(...conditions)),
    ]);

    return {
        data,
        pagination: {
            page,
            limit,
            total: Number(countResult[0]?.count || 0),
            pages: Math.ceil(Number(countResult[0]?.count || 0) / limit),
        },
    };
}

export async function getTransactionById(userId: string, transactionId: string) {
    const transaction = await db.query.transactions.findFirst({
        where: and(
            eq(transactions.id, transactionId),
            eq(transactions.userId, userId)
        ),
    });

    if (!transaction) {
        throw new NotFoundError('Transaction');
    }

    return transaction;
}

export async function createTransaction(
    userId: string,
    data: Omit<NewTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
) {
    const [transaction] = await db
        .insert(transactions)
        .values({
            ...data,
            userId,
            amount: data.amount.toString(),
            date: new Date(data.date),
        })
        .returning();

    // Update account balance
    const balanceChange =
        data.type === 'income'
            ? parseFloat(data.amount.toString())
            : -parseFloat(data.amount.toString());

    await db
        .update(financialAccounts)
        .set({
            balance: sql`${financialAccounts.balance} + ${balanceChange}`,
            updatedAt: new Date(),
        })
        .where(eq(financialAccounts.id, data.accountId));

    return transaction;
}

export async function updateTransaction(
    userId: string,
    transactionId: string,
    data: Partial<Omit<NewTransaction, 'id' | 'userId' | 'createdAt'>>
) {
    const existing = await getTransactionById(userId, transactionId);

    // Revert old balance change
    const oldBalanceChange =
        existing.type === 'income'
            ? -parseFloat(existing.amount)
            : parseFloat(existing.amount);

    await db
        .update(financialAccounts)
        .set({
            balance: sql`${financialAccounts.balance} + ${oldBalanceChange}`,
        })
        .where(eq(financialAccounts.id, existing.accountId));

    // Update transaction
    const [updated] = await db
        .update(transactions)
        .set({
            ...data,
            amount: data.amount?.toString(),
            date: data.date ? new Date(data.date) : undefined,
            updatedAt: new Date(),
        })
        .where(eq(transactions.id, transactionId))
        .returning();

    // Apply new balance change
    const newType = data.type || existing.type;
    const newAmount = data.amount || parseFloat(existing.amount);
    const newAccountId = data.accountId || existing.accountId;
    const newBalanceChange = newType === 'income' ? newAmount : -newAmount;

    await db
        .update(financialAccounts)
        .set({
            balance: sql`${financialAccounts.balance} + ${newBalanceChange}`,
            updatedAt: new Date(),
        })
        .where(eq(financialAccounts.id, newAccountId));

    return updated;
}

export async function deleteTransaction(userId: string, transactionId: string) {
    const transaction = await getTransactionById(userId, transactionId);

    // Revert balance change
    const balanceChange =
        transaction.type === 'income'
            ? -parseFloat(transaction.amount)
            : parseFloat(transaction.amount);

    await db
        .update(financialAccounts)
        .set({
            balance: sql`${financialAccounts.balance} + ${balanceChange}`,
            updatedAt: new Date(),
        })
        .where(eq(financialAccounts.id, transaction.accountId));

    await db.delete(transactions).where(eq(transactions.id, transactionId));
}
