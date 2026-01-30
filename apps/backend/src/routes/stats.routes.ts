import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { statsQuerySchema } from '../middleware/validation.js';
import * as statsService from '../services/stats.service.js';

const router = Router();

// Get summary (income, expense, net savings)
router.get('/summary', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { period } = statsQuerySchema.parse(req.query);
        const summary = await statsService.getSummary(req.user!.id, period);
        res.json(summary);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Get spending by category
router.get('/by-category', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { period } = statsQuerySchema.parse(req.query);
        const breakdown = await statsService.getSpendingByCategory(
            req.user!.id,
            period
        );
        res.json(breakdown);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Get income vs expense trends
router.get('/trends', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { period } = statsQuerySchema.parse(req.query);
        const trends = await statsService.getTrends(req.user!.id, period);
        res.json(trends);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Get balance history
router.get('/balance-history', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { period } = statsQuerySchema.parse(req.query);
        const history = await statsService.getBalanceHistory(req.user!.id, period);
        res.json(history);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

export default router;
