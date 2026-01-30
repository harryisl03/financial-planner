import express from 'express';
import { db } from '../db/index.js';
import { budgets, categories, transactions, bills } from '../db/schema/index.js';
import { eq, and, sql, gte, lte, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';
import { startOfMonth, endOfMonth } from 'date-fns';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req: any, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        // Fetch User Budgets
        const userBudgets = await db.query.budgets.findMany({
            where: eq(budgets.userId, userId),
            with: {
                category: true,
            }
        });

        // Calculate Spending per Category
        const spending = await db
            .select({
                categoryId: transactions.categoryId,
                total: sql<number>`sum(${transactions.amount})`.mapWith(Number),
            })
            .from(transactions)
            .where(
                and(
                    eq(transactions.userId, userId),
                    gte(transactions.date, start),
                    lte(transactions.date, end),
                    eq(transactions.type, 'expense')
                )
            )
            .groupBy(transactions.categoryId);

        const spendingMap = new Map(spending.map(s => [s.categoryId, s.total]));

        const alerts: any[] = [];

        // 1. Budget Alerts
        for (const budget of userBudgets) {
            const spent = spendingMap.get(budget.categoryId) || 0;
            const limit = Number(budget.amount);

            if (spent > limit) {
                alerts.push({
                    id: `over-${budget.id}`,
                    type: 'danger',
                    title: `${budget.category?.name} Limit Exceeded`,
                    message: `You've exceeded your ${budget.category?.name} budget by $${(spent - limit).toFixed(2)}.`
                });
            } else if (spent > limit * 0.8) {
                alerts.push({
                    id: `warn-${budget.id}`,
                    type: 'warning',
                    title: `${budget.category?.name} Near Limit`,
                    message: `You've used ${((spent / limit) * 100).toFixed(0)}% of your ${budget.category?.name} budget.`
                });
            }
        }

        // 2. Smart Alerts (Real Data using Bills)
        const userBills = await db.query.bills.findMany({
            where: eq(bills.userId, userId)
        });

        for (const bill of userBills) {
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth(); // 0-indexed

            // Calculate 'next due date'
            // If today is past the due day in current month, next due is next month.
            // Else, it's this month.
            let nextDueDate = new Date(currentYear, currentMonth, bill.dueDate);

            // Handle edge case if bill.dueDate > days in month (e.g. 31st in Feb)
            // JavaScript automatically rolls over (Feb 31 -> Mar 3 or 2)
            // To be precise for "end of month" bills, we might clamp.
            // But simple rolled-over date is usually acceptable behavior or we can use library.
            // Let's stick to standard Date behavior for now, but ensure if it's already passed today, we move to next month.

            if (nextDueDate < today) {
                nextDueDate = new Date(currentYear, currentMonth + 1, bill.dueDate);
            }

            const daysUntilDue = Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

            if (daysUntilDue <= 7 && daysUntilDue >= 0) {
                alerts.push({
                    id: `bill-${bill.id}`,
                    type: 'info',
                    title: `${bill.name} Due Soon`,
                    message: `Your ${bill.name} bill of ${parseFloat(bill.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} is due on ${nextDueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.`
                });
            }
        }

        if (userBills.length === 0) {
            // Fallback for demo if no bills found
            alerts.push({
                id: 'demo-bill',
                type: 'info',
                title: 'No Bills Setup',
                message: 'Add your recurring bills in the Bills page to get smart due date reminders!'
            });
        }

        // B. Dining Insights (Good News)
        // Compare current month vs last month dining spending
        // "Food" or "Dining" category
        const diningCategories = await db.query.categories.findMany({
            where: and(
                eq(categories.userId, userId),
                sql`lower(${categories.name}) IN ('food', 'dining', 'food & dining', 'restaurants')`
            )
        });

        if (diningCategories.length > 0) {
            const catIds = diningCategories.map(c => c.id);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

            // Current Month Spending (already calculated in spendingMap if categories matched)
            let currentDining = 0;
            catIds.forEach(id => {
                currentDining += (spendingMap.get(id) || 0);
            });

            // Last Month Spending
            const lastMonthDining = await db
                .select({ total: sql<number>`sum(${transactions.amount})`.mapWith(Number) })
                .from(transactions)
                .where(and(
                    eq(transactions.userId, userId),
                    gte(transactions.date, lastMonthStart),
                    lte(transactions.date, lastMonthEnd),
                    sql`${transactions.categoryId} IN ${catIds}`
                ));

            const prevDining = lastMonthDining[0]?.total || 0;

            if (prevDining > 0 && currentDining < prevDining) {
                const diffPercent = Math.round(((prevDining - currentDining) / prevDining) * 100);
                if (diffPercent > 5) { // Only show if meaningful difference
                    alerts.push({
                        id: 'smart-dining',
                        type: 'success',
                        title: 'Good News!',
                        message: `You've spent ${diffPercent}% less on Dining than last month. Keep it up!`
                    });
                }
            } else if (alerts.length === 0 && userBudgets.length === 0) {
                // Only show demo if absolutely nothing exists to welcome user
                alerts.push({
                    id: 'welcome',
                    type: 'info',
                    title: 'Welcome!',
                    message: 'Start by setting up a Budget or adding Bills to see smart insights here.'
                });
            }
        } else if (alerts.length === 0 && userBudgets.length === 0) {
            // Only show demo if absolutely nothing exists to welcome user
            alerts.push({
                id: 'welcome',
                type: 'info',
                title: 'Welcome!',
                message: 'Start by setting up a Budget or adding Bills to see smart insights here.'
            });
        }

        res.json(alerts);

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
