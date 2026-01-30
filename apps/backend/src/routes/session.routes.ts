import express from 'express';
import { db } from '../db/index.js';
import { sessions } from '../db/schema/auth.js';
import { eq, and, ne } from 'drizzle-orm';
import { auth } from '../auth/index.js';

const router = express.Router();

// Get active sessions for the current user
router.get('/', async (req, res) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers
        });

        if (!session) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userSessions = await db.select()
            .from(sessions)
            .where(eq(sessions.userId, session.user.id));

        // Map to safe objects (remove token, add isCurrent)
        const safeSessions = userSessions.map(s => ({
            id: s.id,
            ipAddress: s.ipAddress,
            userAgent: s.userAgent,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
            isCurrent: s.id === session.session.id
        }));

        res.json(safeSessions);
    } catch (error) {
        console.error('Failed to fetch sessions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Revoke a specific session
router.delete('/:id', async (req, res) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers
        });

        if (!session) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Ensure we don't delete someone else's session
        // Although the ID is UUID, good practice to check ownership
        // But since we are deleting by ID directly, we should verify that this session belongs to the user
        // Or we can just use a rigorous WHERE clause

        const result = await db.delete(sessions)
            .where(and(
                eq(sessions.id, id),
                eq(sessions.userId, session.user.id)
            ))
            .returning();

        if (result.length === 0) {
            return res.status(404).json({ error: 'Session not found or belongs to another user' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to revoke session:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
