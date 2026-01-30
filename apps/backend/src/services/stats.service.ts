import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { transactions } from '../db/schema/transactions.js';
import { categories } from '../db/schema/categories.js';
import { financialAccounts } from '../db/schema/accounts.js';

type Period = 'week' | 'month' | 'year' | 'lastMonth';

function getPeriodDates(period: Period): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (period) {
        case 'week':
            start = new Date(now);
            start.setDate(now.getDate() - 7);
            break;
        case 'year':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
        case 'lastMonth':
            // Get first day of last month
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            // Get last day of last month
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            break;
        case 'month':
        default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { start, end };
}


export async function getSummary(userId: string, period: Period = 'month') {
    const { start, end } = getPeriodDates(period);

    // Calculate previous period
    const prevStart = new Date(start);
    const prevEnd = new Date(end);
    if (period === 'month') {
        prevStart.setMonth(prevStart.getMonth() - 1);
        prevEnd.setDate(0); // Last day of previous month
        // prevEnd logic above sets it to last day of *prevStart's* month if prevStart is 1st.
        // Actually, cleaner:
        // Current: Feb 1 - Feb 28
        // Previous: Jan 1 - Jan 31
    } else if (period === 'year') {
        prevStart.setFullYear(prevStart.getFullYear() - 1);
        prevEnd.setFullYear(prevEnd.getFullYear() - 1);
    } else if (period === 'week') {
        prevStart.setDate(prevStart.getDate() - 7);
        prevEnd.setDate(prevEnd.getDate() - 7);
    }
    // Correct prevEnd time to end of day
    prevEnd.setHours(23, 59, 59, 999);


    const [incomeResult, expenseResult, prevIncomeResult, prevExpenseResult] = await Promise.all([
        // Current Period
        db.select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
            .from(transactions)
            .where(and(eq(transactions.userId, userId), eq(transactions.type, 'income'), gte(transactions.date, start), lte(transactions.date, end))),
        db.select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
            .from(transactions)
            .where(and(eq(transactions.userId, userId), eq(transactions.type, 'expense'), gte(transactions.date, start), lte(transactions.date, end))),

        // Previous Period
        db.select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
            .from(transactions)
            .where(and(eq(transactions.userId, userId), eq(transactions.type, 'income'), gte(transactions.date, prevStart), lte(transactions.date, prevEnd))),
        db.select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
            .from(transactions)
            .where(and(eq(transactions.userId, userId), eq(transactions.type, 'expense'), gte(transactions.date, prevStart), lte(transactions.date, prevEnd))),
    ]);

    const totalIncome = parseFloat(incomeResult[0]?.total || '0');
    const totalExpenses = parseFloat(expenseResult[0]?.total || '0');
    const netSavings = totalIncome - totalExpenses;

    // Savings Rate Calculation
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Previous Period calculations
    const prevIncome = parseFloat(prevIncomeResult[0]?.total || '0');
    const prevExpenses = parseFloat(prevExpenseResult[0]?.total || '0');
    const prevSavingsRate = prevIncome > 0 ? ((prevIncome - prevExpenses) / prevIncome) * 100 : 0;

    const trend = savingsRate - prevSavingsRate;

    return {
        income: totalIncome,
        expense: totalExpenses,
        netSavings,
        savingsRate,
        trend,
        period: { start, end },
    };
}

export async function getSpendingByCategory(
    userId: string,
    period: Period = 'month'
) {
    const { start, end } = getPeriodDates(period);

    const result = await db
        .select({
            categoryId: transactions.categoryId,
            categoryName: categories.name,
            categoryIcon: categories.icon,
            categoryColor: categories.color,
            total: sql<string>`SUM(${transactions.amount})`,
        })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
            and(
                eq(transactions.userId, userId),
                eq(transactions.type, 'expense'),
                gte(transactions.date, start),
                lte(transactions.date, end)
            )
        )
        .groupBy(
            transactions.categoryId,
            categories.name,
            categories.icon,
            categories.color
        )
        .orderBy(desc(sql`SUM(${transactions.amount})`));

    const totalSpending = result.reduce(
        (sum, r) => sum + parseFloat(r.total || '0'),
        0
    );

    return result.map((r) => ({
        categoryId: r.categoryId,
        name: r.categoryName || 'Uncategorized',
        icon: r.categoryIcon || 'category',
        color: r.categoryColor || '#94a3b8', // slate-400
        amount: parseFloat(r.total || '0'),
        percentage:
            totalSpending > 0
                ? Math.round((parseFloat(r.total || '0') / totalSpending) * 100)
                : 0,
    }));
}

export async function getTrends(userId: string, period: Period = 'month') {
    const { start, end } = getPeriodDates(period);

    // Fetch raw transactions to avoid complex SQL grouping errors (Drizzle/Postgres specific issues)
    const rawTransactions = await db
        .select({
            date: transactions.date,
            type: transactions.type,
            amount: transactions.amount,
        })
        .from(transactions)
        .where(
            and(
                eq(transactions.userId, userId),
                gte(transactions.date, start),
                lte(transactions.date, end)
            )
        );

    // Transform into Map
    const periodsMap = new Map<string, { income: number; expense: number }>();

    // Helper to format date consistent with desired logic
    const formatDate = (date: Date): string => {
        if (period === 'year') {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else if (period === 'month') {
            // ISO Week calculation
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
            return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
        } else {
            return date.toISOString().split('T')[0];
        }
    };

    // Aggregate in memory
    rawTransactions.forEach((tx) => {
        // Ensure date is a Date object (driver might return string or Date)
        const txDate = new Date(tx.date);
        const periodKey = formatDate(txDate);

        const existing = periodsMap.get(periodKey) || { income: 0, expense: 0 };
        if (tx.type === 'income') existing.income += Number(tx.amount || 0);
        else if (tx.type === 'expense') existing.expense += Number(tx.amount || 0);
        periodsMap.set(periodKey, existing);
    });

    // Zero-filling logic for ALL periods
    const allPeriods: string[] = [];
    // Clone dates to avoid mutation issues
    const currentIter = new Date(start);
    const endIter = new Date(end);

    // Generate timeline
    while (currentIter <= endIter) {
        allPeriods.push(formatDate(currentIter));

        if (period === 'year') {
            currentIter.setMonth(currentIter.getMonth() + 1);
        } else if (period === 'month') {
            currentIter.setDate(currentIter.getDate() + 7);
        } else {
            currentIter.setDate(currentIter.getDate() + 1);
        }
    }

    // Ensure all generated periods exist in map
    allPeriods.forEach(p => {
        if (!periodsMap.has(p)) {
            periodsMap.set(p, { income: 0, expense: 0 });
        }
    });

    // Label formatting
    const getLabel = (periodStr: string): string => {
        if (period === 'year') {
            // Format: 'YYYY-MM'
            const [y, m] = periodStr.split('-');
            if (!y || !m) return periodStr;
            const date = new Date(parseInt(y), parseInt(m) - 1, 1);
            return date.toLocaleDateString('en-US', { month: 'short' });
        } else if (period === 'month') {
            // Format: 'YYYY-W01'
            const match = periodStr.match(/-W(\d+)/);
            return match ? `Week ${parseInt(match[1])}` : periodStr;
        } else {
            // Format: 'YYYY-MM-DD'
            const date = new Date(periodStr);
            if (isNaN(date.getTime())) return periodStr;
            return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        }
    };

    const sortedPeriods = Array.from(periodsMap.entries())
        .filter(([p]) => allPeriods.includes(p) || periodsMap.has(p)) // Keep valid data
        .sort((a, b) => a[0].localeCompare(b[0]));

    return sortedPeriods.map(([periodStr, data]) => ({
        period: periodStr,
        label: getLabel(periodStr),
        income: data.income,
        expense: data.expense,
    }));
}

export async function getBalanceHistory(userId: string, period: 'week' | 'month' | 'year' | 'lastMonth' = 'month') {
    // 1. Get current total balance
    const accounts = await db.query.financialAccounts.findMany({
        where: eq(financialAccounts.userId, userId),
    });

    let currentBalance = accounts.reduce(
        (sum, acc) => sum + parseFloat(acc.balance),
        0
    );

    // 2. Calculate date range and iterations based on period
    const endDate = new Date();
    const startDate = new Date();
    let iterations = 30;
    let groupBy: 'day' | 'week' | 'month' = 'day';

    if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
        iterations = 7;
        groupBy = 'day';
    } else if (period === 'month') {
        startDate.setDate(startDate.getDate() - 30);
        iterations = 30;
        groupBy = 'day';
    } else if (period === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
        iterations = 12;
        groupBy = 'month';
    }

    const periodTransactions = await db
        .select()
        .from(transactions)
        .where(
            and(
                eq(transactions.userId, userId),
                gte(transactions.date, startDate),
                lte(transactions.date, endDate)
            )
        )
        .orderBy(desc(transactions.date));

    // 3. Calculate history based on groupBy
    const history = [];
    const dateMap = new Map();

    // Group transactions by date or month
    periodTransactions.forEach(t => {
        let key: string;
        if (groupBy === 'month') {
            key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
        } else {
            key = t.date.toISOString().split('T')[0];
        }

        if (!dateMap.has(key)) {
            dateMap.set(key, { income: 0, expense: 0 });
        }
        const day = dateMap.get(key);
        if (t.type === 'income') day.income += parseFloat(t.amount);
        else if (t.type === 'expense') day.expense += parseFloat(t.amount);
    });

    // Iterate based on period
    for (let i = 0; i < iterations; i++) {
        const d = new Date();
        let dateStr: string;
        let label: string;

        if (groupBy === 'month') {
            d.setMonth(d.getMonth() - i);
            dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        } else {
            d.setDate(d.getDate() - i);
            dateStr = d.toISOString().split('T')[0];
            label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        const dayData = dateMap.get(dateStr) || { income: 0, expense: 0 };

        // Push current point
        history.push({
            period: dateStr,
            label,
            balance: currentBalance,
            income: dayData.income,
            expense: dayData.expense
        });

        // Update balance for previous point
        currentBalance = currentBalance - dayData.income + dayData.expense;
    }

    // Return reversed array (oldest to newest)
    return history.reverse();
}
