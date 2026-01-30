import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { bills } from '../db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// Validation Schemas
const createBillSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    amount: z.string().or(z.number()).transform(val => val.toString()),
    dueDate: z.number().min(1).max(31),
    category: z.string().default('Utilities'),
    isAutoPaid: z.boolean().default(false)
});

// GET /api/bills - Get all bills for user
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const userBills = await db.query.bills.findMany({
            where: eq(bills.userId, userId),
            orderBy: [desc(bills.createdAt)]
        });
        res.json(userBills);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/bills - Create a new bill
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const data = createBillSchema.parse(req.body);

        const newBill = await db.insert(bills).values({
            userId,
            name: data.name,
            amount: data.amount,
            dueDate: data.dueDate,
            category: data.category,
            isAutoPaid: data.isAutoPaid
        }).returning();

        res.status(201).json(newBill[0]);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /api/bills/:id - Delete a bill
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        const deleted = await db.delete(bills)
            .where(and(eq(bills.id, id as string), eq(bills.userId, userId)))
            .returning();

        if (!deleted.length) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        res.json({ message: 'Bill deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
