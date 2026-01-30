import { Router, Request, Response } from 'express';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
} from '../services/notifications.service.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    try {
        const userId = authReq.user!.id;
        console.log('[Notifications] Fetching for user:', userId);
        const result = await getNotifications(userId);
        console.log('[Notifications] Found:', result.length, 'notifications');
        res.json(result);
    } catch (error: any) {
        console.error('Get notifications error:', error?.message || error);
        console.error('Stack:', error?.stack);
        res.status(500).json({ error: 'Failed to fetch notifications', details: error?.message });
    }
});

router.get('/unread-count', async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    try {
        if (!authReq.user) {
            console.error('[Notifications] User missing in request despite auth middleware');
            return res.status(401).json({ error: 'Unauthorized: User not found' });
        }
        const userId = authReq.user.id;
        console.log('[Notifications] Getting unread count for user:', userId);
        const count = await getUnreadCount(userId);
        console.log('[Notifications] Unread count:', count);
        res.json({ count });
    } catch (error: any) {
        console.error('[Notifications] Get unread count error:', error?.message || error);
        console.error('[Notifications] Stack:', error?.stack);
        res.status(500).json({ error: 'Failed to fetch unread count', details: error?.message });
    }
});

router.patch('/:id/read', async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    try {
        if (!authReq.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = authReq.user.id;
        const { id } = req.params;
        const notificationId = Array.isArray(id) ? id[0] : id;
        const result = await markAsRead(notificationId, userId);
        res.json(result[0]);
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

router.patch('/read-all', async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    try {
        const userId = authReq.user!.id;
        await markAllAsRead(userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

// For testing/demo purposes
router.post('/test', async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    try {
        const userId = authReq.user!.id;
        const { type, title, message } = req.body;
        const result = await createNotification(
            userId,
            type || 'info',
            title || 'Test Notification',
            message || 'This is a test notification'
        );
        res.json(result[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create test notification' });
    }
});

export default router;
