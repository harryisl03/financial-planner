import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/index.js';
import * as schema from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

import { twoFactor } from 'better-auth/plugins';

// Validate environment variables strictly
console.log('[Auth Init] Checking environment variables...');

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const appleClientId = process.env.APPLE_CLIENT_ID;
const appleClientSecret = process.env.APPLE_CLIENT_SECRET;

const socialProviders: any = {};

if (googleClientId && googleClientSecret) {
    console.log('[Auth Init] Google Provider: ENABLED ✅');
    socialProviders.google = {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
    };
} else {
    console.warn('[Auth Init] Google Provider: DISABLED ❌ (Missing Client ID or Secret)');
}

if (appleClientId && appleClientSecret) {
    console.log('[Auth Init] Apple Provider: ENABLED ✅');
    socialProviders.apple = {
        clientId: appleClientId,
        clientSecret: appleClientSecret,
    };
} else {
    console.log('[Auth Init] Apple Provider: DISABLED (Optional)');
}

console.log('[Auth Init] Final Social Providers Config:', Object.keys(socialProviders));

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            user: schema.users,
            session: schema.sessions,
            account: schema.authAccounts,
            verification: schema.verifications,
            twoFactor: schema.twoFactor,
        },
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
    },
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ['google', 'apple'],
        },
    },
    socialProviders: socialProviders,
    plugins: [
        twoFactor({
            issuer: 'FinDash',
        }),
    ],
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day - update session on each request if older
    },
    logger: {
        level: "debug",
    },
    advanced: {
        defaultCookieAttributes: {
            secure: true,
            sameSite: "none",
            httpOnly: true,
            partitioned: true, // CHIPS support for cross-site cookies
        },
    },
    baseURL: (() => {
        const url = process.env.BETTER_AUTH_URL || "https://waterish-unephemerally-daysi.ngrok-free.dev/api/auth";
        const finalUrl = url.endsWith('/api/auth') ? url : `${url}/api/auth`;
        console.log(`[Better Auth] Computed baseURL: ${finalUrl}`);
        return finalUrl;
    })(),
    trustedOrigins: [
        'http://localhost:5173',
        'https://waterish-unephemerally-daysi.ngrok-free.dev',
        'http://waterish-unephemerally-daysi.ngrok-free.dev',
        process.env.FRONTEND_URL || 'http://localhost:5173'
    ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
