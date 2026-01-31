import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import compression from 'compression';

import { auth } from './auth/index.js';
import { toNodeHandler } from 'better-auth/node';
import { seedSystemCategories } from './services/category.service.js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';
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


import { PORT, FRONTEND_URL, CORS_ORIGINS, BETTER_AUTH_URL } from './config.js';



// Trust proxy is required for Render/Heroku (behind load balancer) AND for secure cookies
app.set('trust proxy', true);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            // Check if origin matches any allowed origin
            const isAllowed = CORS_ORIGINS.includes(origin) || CORS_ORIGINS.some(allowed => origin === allowed); // Simple check

            if (isAllowed) {
                callback(null, true);
            } else {
                // In development, be more lenient or log warning
                console.warn(`⚠️ Blocked by CORS: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
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

// Better Auth handler (must be before express.json() to handle body stream correctly)
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
// Root route: Redirect to frontend (handling auth errors that redirect here)
app.get('/', (req, res) => {
    // If query contains error, pass it to frontend
    if (Object.keys(req.query).length > 0) {
        const queryString = new URLSearchParams(req.query as any).toString();
        return res.redirect(`${FRONTEND_URL}?${queryString}`);
    }
    return res.redirect(FRONTEND_URL);
});



// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database & System Health Check
app.get('/api/health/db', async (req, res) => {
    try {
        const start = Date.now();
        // 1. Check basic connection
        await db.execute(sql`SELECT 1`);

        // 2. Check Schema Existence (Users table)
        let schemaStatus = 'unknown';
        let userCount = -1;
        try {
            const usersResult = await db.execute(sql`SELECT count(*) as count FROM users`);
            userCount = Number(usersResult[0].count);
            schemaStatus = 'ok';
        } catch (e: any) {
            schemaStatus = `missing_table: ${e.message}`;
        }

        const duration = Date.now() - start;

        // 3. Env Var Check
        const envCheck = {
            BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? '✅ Set' : '❌ MISSING',
            BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'Using Fallback',
            FRONTEND_URL: process.env.FRONTEND_URL || 'Using Fallback',
            NODE_ENV: process.env.NODE_ENV
        };

        res.json({
            status: schemaStatus === 'ok' ? 'ok' : 'error',
            db: 'connected',
            schema: schemaStatus,
            userCount,
            latency: `${duration}ms`,
            env: envCheck,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('❌ Database Health Check Failed:', error);
        res.status(500).json({
            status: 'error',
            db: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
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

// Debug Request Protocol (To verify Trust Proxy)
app.get('/api/debug/req', (req, res) => {
    res.json({
        protocol: req.protocol,
        secure: req.secure,
        headers: {
            'x-forwarded-proto': req.headers['x-forwarded-proto'],
            'host': req.headers['host'],
            'origin': req.headers['origin']
        },
        trustProxyConfig: app.get('trust proxy')
    });
});

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
            console.log(`🔐 Auth: ${BETTER_AUTH_URL}`);
            console.log(`🌍 Frontend: ${FRONTEND_URL}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

main();
