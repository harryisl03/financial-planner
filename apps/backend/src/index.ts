import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import compression from 'compression';

import { auth } from './auth/index.js';
import { toNodeHandler } from 'better-auth/node';
import { seedSystemCategories } from './services/category.service.js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './db/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import accountRoutes from './routes/account.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import categoryRoutes from './routes/category.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import userRoutes from './routes/user.routes.js';
import statsRoutes from './routes/stats.routes.js';
import notificationRouter from './routes/notifications.js';
// import passwordRouter from './routes/password.js'; // Merging into use routes or keeping separate?
// Let's keep it clean. I'll move the logic to user.routes.js or keep it and mount it better.
// Actually, mounting at /api/users seems better.
// import passwordRouter from './routes/password.js';
import savingsRouter from './routes/savings.routes.js';
import alertsRouter from './routes/alerts.routes.js';
import billsRouter from './routes/bills.routes.js';
import sessionRoutes from './routes/session.routes.js';

const app = express();


const PORT = process.env.PORT || 3001;

// Trust proxy is required for Render/Heroku (behind load balancer) AND for secure cookies
app.set('trust proxy', 1);

// Force restart for changes to take effect
// Middleware
app.use(
    cors({
        origin: [
            'http://localhost:5173',
            'https://waterish-unephemerally-daysi.ngrok-free.dev',
            process.env.FRONTEND_URL || 'http://localhost:5173'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    })
);
// Legacy client fix: Rewrite malformed TOTP URL
app.use((req, res, next) => {
    if (req.url.includes('/verify-t-o-t-p')) {
        req.url = req.url.replace('/verify-t-o-t-p', '/verify-totp');
    }
    next();
});

// --- DEBUG MIDDLEWARE: LOG SET-COOKIE HEADERS ---
app.use((req, res, next) => {
    // Intercept response to log cookies being set
    const originalSetHeader = res.setHeader;
    res.setHeader = function (name, value) {
        if (name.toLowerCase() === 'set-cookie') {
            console.log(`\n🍪 [Set-Cookie Debug] ${req.url}`);
            console.log('Value:', JSON.stringify(value));
            console.log('------------------------------------');
        }
        return originalSetHeader.apply(this, [name, value] as any);
    };
    next();
});

// --- DEBUG MIDDLEWARE FOR AUTH CALLBACK ---
app.use('/api/auth/callback', (req, res, next) => {
    console.log('\n🔍 [Auth Callback Debug]');
    console.log('URL:', req.originalUrl);
    console.log('Protocol:', req.protocol);
    console.log('Secure (req.secure):', req.secure);
    console.log('X-Forwarded-Proto:', req.headers['x-forwarded-proto']);
    console.log('Cookie Size:', req.headers.cookie ? req.headers.cookie.length : 0);
    // Be careful not to log sensitive tokens, just check existence
    console.log('Cookies present:', req.headers.cookie ? 'YES' : 'NO');
    if (req.headers.cookie) {
        console.log('Cookie Names:', req.headers.cookie.split(';').map(c => c.trim().split('=')[0]).join(', '));
    }
    console.log('------------------------------------\n');
    next();
});

app.use(express.urlencoded({ extended: true })); // Parse Form Data FIRST

// --- MIDDLEWARE SHIM: Convert Form POST to JSON for Social Login ---
// Better Auth only accepts JSON, but we must use Form POST to get first-party cookies.
// This middleware intercepts the form data and "tricks" Better Auth into thinking it's JSON.
// AND it intercepts the response to perform a real redirect instead of sending JSON back.
app.use((req, res, next) => {
    if (req.path.includes('/sign-in/social') && req.method === 'POST' && req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
        console.log('🔄 [Auth Shim] Converting Form POST to JSON and Intercepting Redirect');
        req.headers['content-type'] = 'application/json'; // Lie to Better Auth

        // Intercept Response to auto-redirect
        const originalEnd = res.end;
        res.end = function (this: any, chunk: any, encoding?: any, cb?: any) {
            // Normalize arguments
            if (typeof chunk === 'function') { cb = chunk; chunk = null; encoding = null; }
            if (typeof encoding === 'function') { cb = encoding; encoding = null; }

            if (chunk) {
                try {
                    const bodyStr = chunk.toString();
                    // Check if it looks like JSON
                    if (bodyStr.trim().startsWith('{')) {
                        const body = JSON.parse(bodyStr);
                        if (body && body.url && body.redirect) {
                            console.log('🔄 [Auth Shim] Trapped JSON response, forcing REDIRECT to:', body.url);
                            // Restore original endpoint to allow redirect to work properly or just redirect
                            res.end = originalEnd;
                            return res.redirect(body.url);
                        }
                    }
                } catch (e) {
                    // ignore parse error
                }
            }

            return originalEnd.call(this, chunk, encoding, cb);
        } as any;
    }
    next();
});

// Better Auth handler (must be before express.json() but AFTER urlencoded if we want to shim it)
app.all('/api/auth/*', toNodeHandler(auth));

app.use(express.json());
app.use(compression());

// API routes
// app.use('/api/auth', authRoutes); // Handled by Better Auth
app.use('/api/sessions', sessionRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRouter);
app.use('/api/savings', savingsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/bills', billsRouter);

// Root route: Redirect to frontend (handling auth errors that redirect here)
app.get('/', (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // If query contains error, pass it to frontend
    if (Object.keys(req.query).length > 0) {
        const queryString = new URLSearchParams(req.query as any).toString();
        return res.redirect(`${frontendUrl}?${queryString}`);
    }
    return res.redirect(frontendUrl);
});

// Debug endpoint to check env vars via browser
app.get('/api/debug-config', (req, res) => {
    res.json({
        betterAuthUrl: process.env.BETTER_AUTH_URL || '(Not Set)',
        frontendUrl: process.env.FRONTEND_URL || '(Not Set)',
        googleClientId: process.env.GOOGLE_CLIENT_ID ? '✅ FOUND' : '❌ MISSING',
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? '✅ FOUND' : '❌ MISSING',
        nodeEnv: process.env.NODE_ENV,
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(
    (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        console.error('Unhandled error:', err);
        res.status(err.statusCode || 500).json({
            error: err.message || 'Internal Server Error',
            code: err.code || 'INTERNAL_ERROR',
        });
    }
);

// Start server
async function main() {
    try {
        // Seed default categories
        await seedSystemCategories();

        // --- DEBUG AUTH CONFIG ---
        console.log('\n🔍 --- AUTH CONFIGURATION CHECK ---');
        console.log('BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL || '(Not Set)');
        console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '(Not Set)');
        console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Found' : '❌ MISSING (Social Login will be disabled)');
        console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Found' : '❌ MISSING');
        console.log('------------------------------------\n');


        // Run migrations programmatically
        console.log('📦 Starting database migration process...');
        console.log('Current working directory:', process.cwd());

        const migrationFolder = path.join(process.cwd(), 'drizzle');
        console.log('Looking for migrations in:', migrationFolder);

        if (fs.existsSync(migrationFolder)) {
            console.log('✅ Migration folder found.');
            const files = fs.readdirSync(migrationFolder);
            console.log('Migration files found:', files);
        } else {
            console.error('❌ Migration folder NOT found!');
            // Try relative path as fallback
            console.log('Checking relative ./drizzle path...');
            if (fs.existsSync('./drizzle')) {
                console.log('✅ ./drizzle exists.');
            } else {
                console.log('❌ ./drizzle does not exist either.');
            }
        }

        try {
            await migrate(db, { migrationsFolder: 'drizzle' });
            console.log('✅ Migrations completed successfully!');
        } catch (migrationError: any) {
            console.error('❌ Migration FAILED detailed error:', migrationError);
            // Dump error properties
            if (migrationError.code) console.error('Error Code:', migrationError.code);
            if (migrationError.detail) console.error('Error Detail:', migrationError.detail);
            // Rethrow to stop startup? or continue? better stop.
            throw migrationError;
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📖 API docs: http://localhost:${PORT}/api`);
            console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

main();
