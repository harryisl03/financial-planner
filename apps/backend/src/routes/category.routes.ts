import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { createCategorySchema, updateCategorySchema } from '../middleware/validation.js';
import * as categoryService from '../services/category.service.js';

const router = Router();

// List categories
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const categories = await categoryService.getCategoriesByUserId(req.user!.id);
        res.json(categories);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Create custom category
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const data = createCategorySchema.parse(req.body);
        const category = await categoryService.createCategory(req.user!.id, data);
        res.status(201).json(category);
    } catch (error: any) {
        res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Update category
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const data = updateCategorySchema.parse(req.body);
        const category = await categoryService.updateCategory(
            req.user!.id,
            req.params.id as string,
            data
        );
        res.json(category);
    } catch (error: any) {
        res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Delete category
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        await categoryService.deleteCategory(req.user!.id, req.params.id as string);
        res.status(204).send();
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

export default router;
