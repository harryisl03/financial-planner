import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import {
    updateProfileSchema,
    updatePreferencesSchema,
} from '../middleware/validation.js';
import * as userService from '../services/user.service.js';
// import { db } from '../db/index.js';
// import { authAccounts } from '../db/schema/auth.js';
// import { eq, and } from 'drizzle-orm';
// import { randomUUID } from 'crypto';
// import bcrypt from 'bcrypt';

const router = Router();

// Get current user profile
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const user = await userService.getUserById(req.user!.id);
        res.json(user);
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

// Update user profile
router.patch('/me', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const data = updateProfileSchema.parse(req.body);
        const user = await userService.updateUserProfile(req.user!.id, data);
        res.json(user);
    } catch (error: any) {
        res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Get user preferences
router.get(
    '/me/preferences',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
        try {
            const prefs = await userService.getUserPreferences(req.user!.id);
            res.json(prefs);
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ error: error.message });
        }
    }
);

// Update user preferences
router.patch(
    '/me/preferences',
    requireAuth,
    async (req: AuthRequest, res: Response) => {
        try {
            const data = updatePreferencesSchema.parse(req.body);
            const prefs = await userService.updateUserPreferences(
                req.user!.id,
                data
            );
            res.json(prefs);
        } catch (error: any) {
            res.status(error.statusCode || 400).json({ error: error.message });
        }
    }
);



// Delete user account
router.delete('/me', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        await userService.deleteUser(req.user!.id);
        res.clearCookie('better-auth.session_token'); // Clear session cookie
        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
});

export default router;
