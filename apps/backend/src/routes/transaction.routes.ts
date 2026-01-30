import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import {
    createTransactionSchema,
    updateTransactionSchema,
    transactionQuerySchema,
} from '../middleware/validation.js';
import * as transactionService from '../services/transaction.service.js';

const router = Router();

// List transactions with filters
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const filters = transactionQuerySchema.parse(req.query);
        const result = await transactionService.getTransactionsByUserId(
            req.user!.id,
            filters
        );
        res.json(result);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Get single transaction
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const transaction = await transactionService.getTransactionById(
            req.user!.id,
            req.params.id
        );
        res.json(transaction);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Create transaction
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const data = createTransactionSchema.parse(req.body);
        const transaction = await transactionService.createTransaction(
            req.user!.id,
            { ...data, date: new Date(data.date), amount: data.amount.toString() }
        );
        res.status(201).json(transaction);
    } catch (error: any) {
        res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Update transaction
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const data = updateTransactionSchema.parse(req.body);
        const transaction = await transactionService.updateTransaction(
            req.user!.id,
            req.params.id,
            data
        );
        res.json(transaction);
    } catch (error: any) {
        res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Delete transaction
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        await transactionService.deleteTransaction(req.user!.id, req.params.id);
        res.status(204).send();
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

export default router;
