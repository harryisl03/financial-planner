import React, { createContext, useContext } from 'react';
import { useSession, signIn, signUp, signOut, twoFactor } from '../lib/auth-client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const { data, isPending, error } = useSession(); // Changed `data: session` to `data`

    const user = data?.user;
    const session = data?.session;

    React.useEffect(() => {
        console.log('[AuthContext] Session State:', {
            isLoading: isPending,
            hasUser: !!user,
            hasSession: !!session,
            error
        });
    }, [isPending, user, session, error]);

    const value = {
        user: user ?? null,
        session: session ?? null,
        isAuthenticated: !!user,
        isLoading: isPending,
        error,
        signIn: async (email, password) => {
            try {
                const result = await signIn.email({ email, password });
                return result;
            } catch (error) {
                // Determine if it is a 2FA requirement disguised as an error or just a failed login
                // Better-auth usually returns 2FA as a specific response payload, but if it throws on 401/403:
                if (error?.status === 422 && error?.body?.code === "TWO_FACTOR_REQUIRED") {
                    return { error: { code: "TWO_FACTOR_REQUIRED", message: "2FA Required" } };
                }

                // General Auth Error
                if (error?.status === 401 || error?.status === 403) {
                    return { error: { message: "Invalid email or password" } };
                }

                return {
                    error: {
                        message: error?.body?.message || error?.statusText || error?.message || "Failed to sign in"
                    }
                };
            }
        },
        signUp: async (email, password, name) => {
            const result = await signUp.email({ email, password, name });
            return result;
        },
        signInWithGoogle: async () => {
            const result = await signIn.social({
                provider: 'google',
                callbackURL: window.location.origin
            });
            return result;
        },
        signInWithApple: async () => {
            const result = await signIn.social({
                provider: 'apple',
                callbackURL: window.location.origin
            });
            return result;
        },
        signOut: async () => {
            await signOut();
        },
        twoFactor: {
            enable: (args) => twoFactor.enable(args),
            disable: (args) => twoFactor.disable(args),
            verifyTOTP: (args) => twoFactor.verifyTOTP(args),
            verifyBackupCode: (args) => twoFactor.verifyBackupCode(args),
            generateBackupCodes: (args) => twoFactor.generateBackupCodes(args),
        }
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
