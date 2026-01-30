import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { createBudgetSchema, updateBudgetSchema } from '../middleware/validation.js';
import * as budgetService from '../services/budget.service.js';

const router = Router();

// List budgets with spending progress
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const budgets = await budgetService.getBudgetsByUserId(req.user!.id);
        res.json(budgets);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Get budget overview
router.get('/overview', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const overview = await budgetService.getBudgetOverview(req.user!.id);
        res.json(overview);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Create budget
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const data = createBudgetSchema.parse(req.body);
        const budget = await budgetService.createBudget(req.user!.id, data);
        res.status(201).json(budget);
    } catch (error: any) {
        res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Update budget
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const data = updateBudgetSchema.parse(req.body);
        const budget = await budgetService.updateBudget(
            req.user!.id,
            req.params.id,
            data
        );
        res.json(budget);
    } catch (error: any) {
        res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Delete budget
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        await budgetService.deleteBudget(req.user!.id, req.params.id);
        res.status(204).send();
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

export default router;
