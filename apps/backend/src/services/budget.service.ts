import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { budgets } from '../db/schema/budgets.js';
import { transactions } from '../db/schema/transactions.js';
import { categories } from '../db/schema/categories.js';
import { NotFoundError } from '../utils/errors.js';
import type { NewBudget } from '../db/schema/budgets.js';

export async function getBudgetsByUserId(userId: string) {
    const userBudgets = await db.query.budgets.findMany({
        where: eq(budgets.userId, userId),
        with: {
            category: true,
        },
    });

    // Calculate spent amount for each budget
    const budgetsWithSpending = await Promise.all(
        userBudgets.map(async (budget) => {
            // For monthly budgets, use current month; for yearly, use current year
            const now = new Date();
            let startDate: Date;
            let endDate: Date;

            if (budget.periodType === 'yearly') {
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            } else {
                // Default to monthly - use current month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            }

            const spentResult = await db
                .select({
                    spent: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
                })
                .from(transactions)
                .where(
                    and(
                        eq(transactions.userId, userId),
                        eq(transactions.categoryId, budget.categoryId),
                        eq(transactions.type, 'expense'),
                        gte(transactions.date, startDate),
                        lte(transactions.date, endDate)
                    )
                );

            const spent = parseFloat(spentResult[0]?.spent || '0');
            const limit = parseFloat(budget.amount);
            const remaining = limit - spent;
            const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

            return {
                ...budget,
                spent,
                limit,
                remaining,
                percentage,
                status:
                    percentage >= 100
                        ? 'exceeded'
                        : percentage >= 90
                            ? 'warning'
                            : 'ok',
            };
        })
    );

    return budgetsWithSpending;
}

export async function getBudgetById(userId: string, budgetId: string) {
    const budget = await db.query.budgets.findFirst({
        where: and(eq(budgets.id, budgetId), eq(budgets.userId, userId)),
    });

    if (!budget) {
        throw new NotFoundError('Budget');
    }

    return budget;
}

export async function createBudget(
    userId: string,
    data: Omit<NewBudget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
) {
    const [budget] = await db
        .insert(budgets)
        .values({
            ...data,
            userId,
            amount: data.amount.toString(),
        })
        .returning();

    return budget;
}

export async function updateBudget(
    userId: string,
    budgetId: string,
    data: Partial<Omit<NewBudget, 'id' | 'userId' | 'createdAt'>>
) {
    await getBudgetById(userId, budgetId);

    const [updated] = await db
        .update(budgets)
        .set({
            ...data,
            amount: data.amount?.toString(),
            updatedAt: new Date(),
        })
        .where(eq(budgets.id, budgetId))
        .returning();

    return updated;
}

export async function deleteBudget(userId: string, budgetId: string) {
    await getBudgetById(userId, budgetId);
    await db.delete(budgets).where(eq(budgets.id, budgetId));
}

export async function getBudgetOverview(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalBudgetResult, totalSpentResult] = await Promise.all([
        db
            .select({
                total: sql<string>`COALESCE(SUM(${budgets.amount}), 0)`,
            })
            .from(budgets)
            .where(
                and(
                    eq(budgets.userId, userId),
                    lte(budgets.startDate, endOfMonth.toISOString().split('T')[0]),
                    gte(budgets.endDate, startOfMonth.toISOString().split('T')[0])
                )
            ),
        db
            .select({
                total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
            })
            .from(transactions)
            .where(
                and(
                    eq(transactions.userId, userId),
                    eq(transactions.type, 'expense'),
                    gte(transactions.date, startOfMonth),
                    lte(transactions.date, endOfMonth)
                )
            ),
    ]);

    const totalBudget = parseFloat(totalBudgetResult[0]?.total || '0');
    const totalSpent = parseFloat(totalSpentResult[0]?.total || '0');
    const remaining = totalBudget - totalSpent;
    const percentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    return {
        totalBudget,
        totalSpent,
        remaining,
        percentage,
        period: {
            start: startOfMonth,
            end: endOfMonth,
        },
    };
}
