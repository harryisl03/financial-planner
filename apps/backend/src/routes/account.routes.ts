import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { createAccountSchema, updateAccountSchema } from '../middleware/validation.js';
import * as accountService from '../services/account.service.js';

const router = Router();

// List user's accounts
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const accounts = await accountService.getAccountsByUserId(req.user!.id);
        res.json(accounts);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Get total balance
router.get('/total-balance', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const total = await accountService.getTotalBalance(req.user!.id);
        res.json({ totalBalance: total });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Get single account
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const account = await accountService.getAccountById(
            req.user!.id,
            req.params.id as string
        );
        res.json(account);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Create account
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const data = createAccountSchema.parse(req.body);
        const account = await accountService.createAccount(req.user!.id, { ...data, balance: data.balance.toString() });
        res.status(201).json(account);
    } catch (error: any) {
        res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Update account
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const data = updateAccountSchema.parse(req.body);
        const account = await accountService.updateAccount(
            req.user!.id,
            req.params.id as string,
            { ...data, balance: data.balance?.toString() }
        );
        res.json(account);
    } catch (error: any) {
        res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Delete account
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        await accountService.deleteAccount(req.user!.id, req.params.id as string);
        res.status(204).send();
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

export default router;
