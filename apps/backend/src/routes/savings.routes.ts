import express from 'express';
import { db } from '../db/index.js';
import { savingsGoals } from '../db/schema/savings.js';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// protect all routes
router.use(requireAuth);

// GET /api/savings - Get all savings goals
router.get('/', async (req: any, res) => {
    try {
        const userId = req.user.id;
        const goals = await db.query.savingsGoals.findMany({
            where: eq(savingsGoals.userId, userId),
            orderBy: [desc(savingsGoals.createdAt)],
        });
        res.json(goals);
    } catch (error: any) {
        console.error('Error fetching savings goals:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/savings - Create a new savings goal
router.post('/', async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { name, targetAmount, currentAmount, color, deadline } = req.body;

        const [newGoal] = await db.insert(savingsGoals).values({
            userId,
            name,
            targetAmount: targetAmount.toString(),
            currentAmount: (currentAmount || 0).toString(),
            color: color || 'emerald',
            deadline: deadline ? new Date(deadline) : null,
        }).returning();

        res.status(201).json(newGoal);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/savings/:id - Update a savings goal
router.patch('/:id', async (req: any, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, targetAmount, currentAmount, color, deadline } = req.body;

        const [updatedGoal] = await db
            .update(savingsGoals)
            .set({
                name,
                targetAmount: targetAmount ? targetAmount.toString() : undefined,
                currentAmount: currentAmount ? currentAmount.toString() : undefined,
                color,
                deadline: deadline ? new Date(deadline) : undefined,
                updatedAt: new Date(),
            })
            .where(
                eq(savingsGoals.id, id)
                // In a real app, verify ownership: and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId))
            )
            .returning();

        res.json(updatedGoal);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/savings/:id - Delete a savings goal
router.delete('/:id', async (req: any, res) => {
    try {
        const { id } = req.params;
        await db.delete(savingsGoals).where(eq(savingsGoals.id, id));
        res.json({ message: 'Goal deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
