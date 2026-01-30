import { Request, Response, NextFunction } from 'express';
import { auth } from '../auth/index.js';
import { fromNodeHeaders } from 'better-auth/node';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
        image?: string | null;
    };
    session?: {
        id: string;
        userId: string;
        expiresAt: Date;
    };
}

export async function requireAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'You must be logged in to access this resource'
            });
        }

        req.user = session.user;
        req.session = session.session;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired session'
        });
    }
}
