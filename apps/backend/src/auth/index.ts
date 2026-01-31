import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/index.js';
import * as schema from '../db/schema/index.js';
import { eq } from 'drizzle-orm';

import { twoFactor } from 'better-auth/plugins';

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
    // Automatically link accounts if email matches (e.g. Email/Pass -> Google)
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ['google', 'apple'],
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || 'disabled',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'disabled',
            enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
            mapProfileToUser: (profile: any) => {
                return {
                    name: profile.name || profile.given_name || 'User',
                    email: profile.email,
                    image: profile.picture,
                    emailVerified: profile.email_verified || false,
                };
            },
        },
        apple: {
            clientId: process.env.APPLE_CLIENT_ID || 'disabled',
            clientSecret: process.env.APPLE_CLIENT_SECRET || 'disabled',
            enabled: !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET),
        },

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
            },
        },
        baseURL: (() => {
            const url = process.env.BETTER_AUTH_URL || "https://waterish-unephemerally-daysi.ngrok-free.dev/api/auth";
            return url.endsWith('/api/auth') ? url : `${url}/api/auth`;
        })(),
        trustedOrigins: [
            'http://localhost:5173',
            'https://waterish-unephemerally-daysi.ngrok-free.dev',
            // Also allow without protocol just in case, or http version
            'http://waterish-unephemerally-daysi.ngrok-free.dev',
            process.env.FRONTEND_URL || 'http://localhost:5173'
        ],
    });

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
