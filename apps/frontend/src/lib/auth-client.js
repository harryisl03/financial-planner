import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "",
    plugins: [
        twoFactorClient({
            twoFactorPage: "/two-factor", // redirection path if needed, or handle inline
        })
    ]
});

export const {
    signIn,
    signUp,
    signOut,
    useSession,
    getSession,
    twoFactor
} = authClient;
