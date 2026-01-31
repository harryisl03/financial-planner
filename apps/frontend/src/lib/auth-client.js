import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

const baseURL = import.meta.env.VITE_API_URL || "https://financial-planner-api.onrender.com"; // Fallback to known prod URL for debugging
console.log('[Auth Client] Initializing with Base URL:', baseURL);
console.log('[Auth Client] VITE_API_URL:', import.meta.env.VITE_API_URL || '(Not Set)');

export const authClient = createAuthClient({
    baseURL: baseURL,
    fetchOptions: {
        credentials: "include", // Critical for cross-domain cookies
    },
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
