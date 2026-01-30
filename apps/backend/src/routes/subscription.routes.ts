import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import * as subscriptionService from '../services/subscription.service.js';

const router = Router();

// Get current subscription
router.get('/current', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const subscription = await subscriptionService.getSubscriptionByUserId(
            req.user!.id
        );
        res.json(subscription);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Upgrade subscription
router.post('/upgrade', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { plan } = req.body as { plan: 'pro' | 'enterprise' };
        if (!['pro', 'enterprise'].includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }
        const subscription = await subscriptionService.upgradeSubscription(
            req.user!.id,
            plan
        );
        res.json(subscription);
    } catch (error: any) {
        res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Downgrade subscription
router.post('/downgrade', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const subscription = await subscriptionService.downgradeSubscription(
            req.user!.id
        );
        res.json(subscription);
    } catch (error: any) {
        res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Cancel subscription
router.post('/cancel', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const subscription = await subscriptionService.cancelSubscription(
            req.user!.id
        );
        res.json(subscription);
    } catch (error: any) {
        res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Get invoices
router.get('/invoices', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const invoices = await subscriptionService.getInvoicesByUserId(req.user!.id);
        res.json(invoices);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

export default router;
