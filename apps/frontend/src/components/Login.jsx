import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authClient, getSession } from '../lib/auth-client';
import BackendStatusChecker from './BackendStatusChecker';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [twoFactorStep, setTwoFactorStep] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [isBackupCode, setIsBackupCode] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // ... inside component ...

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authClient.forgetPassword({
                email,
                redirectTo: `${window.location.origin}/reset-password`,
            });
            alert('If an account exists with this email, a password reset link has been sent.');
            setIsForgotPassword(false);
        } catch (err) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    const { signIn, signUp, signInWithGoogle, signInWithApple, twoFactor } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const error = searchParams.get('error');
        if (error) {
            navigate(`/auth-error?error=${error}&error_description=${searchParams.get('error_description') || ''}`, { replace: true });
        }
    }, [searchParams, navigate]);

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const result = await signIn(email, password);

                // Check for 2FA requirement
                if (result?.error?.code === "TWO_FACTOR_REQUIRED" || result?.twoFactorRedirect) {
                    setTwoFactorStep(true);
                    setLoading(false);
                    return;
                }

                if (result?.error) {
                    setError(result.error.message || 'Failed to sign in');
                } else {
                    // Force session refresh before navigation to prevent race condition
                    await getSession();
                    // navigate(from, { replace: true });
                    window.location.href = from; // Force full reload to ensure AuthContext picks up the new cookie immediately
                }
            } else {
                const result = await signUp(email, password, name);
                if (!acceptedTerms) {
                    setError('Please accept the Terms of Service and Privacy Policy to create an account.');
                    setLoading(false);
                    return;
                }
                if (result?.error) {
                    setError(result.error.message || 'Failed to create account');
                } else {
                    navigate(from, { replace: true });
                }
            }
        } catch (err) {
            console.error("Login Error:", err);
            // Fallback error handling
            if (err.message && (err.message.includes('401') || err.message.includes('Unauthorized') || err.message.includes('Invalid email or password'))) {
                setError(
                    <span>
                        Invalid email or password. <br />
                        <span className="text-xs opacity-75">If you normally use Google, please login with Google.</span>
                    </span>
                );
            } else {
                setError(err.message || 'An error occurred. Please try again.');
            }
        } finally {
            if (!twoFactorStep) setLoading(false);
        }
    };

    const handleTwoFactorSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let res;
            if (isBackupCode) {
                res = await twoFactor.verifyBackupCode({
                    code: twoFactorCode,
                    trustDevice: true
                });
            } else {
                res = await twoFactor.verifyTOTP({
                    code: twoFactorCode,
                    trustDevice: true
                });
            }

            if (res?.error) {
                throw new Error(res.error.message || 'Invalid code');
            }

            await getSession(); // Refresh session to ensure user is fully authenticated
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            await signInWithGoogle({
                callbackURL: '/' // Redirect to root (Dashboard) after login
            });
        } catch (err) {
            console.error("Google Login Error:", err);
            // alert("Google Login Error: " + (err.message || JSON.stringify(err))); // Uncomment for aggressive debugging
            setError(err.message || 'Failed to sign in with Google');
        }
    };

    const handleAppleLogin = async () => {
        setError('');
        try {
            await signInWithApple();
        } catch (err) {
            setError(err.message || 'Failed to sign in with Apple');
        }
    };

    if (twoFactorStep) {
        return (
            <div className="bg-background-dark min-h-screen flex items-center justify-center p-4 font-display">
                <div className="relative w-full max-w-md">
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="glass-card relative w-full rounded-[24px] p-8 md:p-10 flex flex-col gap-6" style={{
                        background: 'rgba(30, 41, 59, 0.8)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4 border border-white/10">
                                <span className="material-symbols-outlined text-primary text-2xl">
                                    {isBackupCode ? 'dataset' : 'phonelink_lock'}
                                </span>
                            </div>
                            <h1 className="text-white tracking-tight text-2xl font-bold mb-2">
                                {isBackupCode ? 'Backup Code' : 'Two-Factor Authentication'}
                            </h1>
                            <p className="text-slate-400 text-sm text-center">
                                {isBackupCode
                                    ? 'Enter one of your 8-character backup codes.'
                                    : 'Enter the 6-digit code from your authenticator app.'}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <form className="flex flex-col gap-4" onSubmit={handleTwoFactorSubmit}>
                            <div className="space-y-2">
                                <input
                                    className={`block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-primary focus:ring-1 focus:ring-emerald-500 dark:focus:ring-primary focus:outline-none transition-all text-sm font-medium text-center tracking-[0.5em] font-mono text-xl uppercase`}
                                    placeholder={isBackupCode ? "XXXXXXXX" : "000 000"}
                                    type="text"
                                    value={twoFactorCode}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase(); // Backup codes usually alphanumeric/uppercase
                                        if (isBackupCode) {
                                            setTwoFactorCode(val.slice(0, 10)); // Limit length for backup codes (usually 8-10 chars)
                                        } else {
                                            setTwoFactorCode(val.replace(/\D/g, '').slice(0, 6));
                                        }
                                    }}
                                    autoFocus
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || (isBackupCode ? twoFactorCode.length < 8 : twoFactorCode.length !== 6)}
                                className="mt-2 w-full bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-primary hover:from-emerald-400 hover:to-cyan-400 dark:hover:from-emerald-300 dark:hover:to-cyan-300 text-white dark:text-slate-900 font-bold py-3.5 px-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] dark:shadow-[0_0_20px_rgba(19,236,236,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] dark:hover:shadow-[0_0_25px_rgba(19,236,236,0.5)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? 'Verifying...' : 'Verify'}
                            </button>
                        </form>

                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={() => {
                                    setIsBackupCode(!isBackupCode);
                                    setTwoFactorCode('');
                                    setError('');
                                }}
                                className="text-emerald-500 dark:text-primary hover:text-emerald-400 dark:hover:text-emerald-300 text-sm font-medium transition-colors"
                            >
                                {isBackupCode ? 'Use Authenticator App' : 'Use Backup Code'}
                            </button>

                            <button
                                onClick={() => setTwoFactorStep(false)}
                                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors"
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ... inside render ...

    if (isForgotPassword) {
        return (
            <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-4 font-display transition-colors duration-300 overflow-hidden">
                <div className="relative w-full max-w-md">
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="glass-card relative w-full rounded-[24px] p-6 sm:p-8 flex flex-col gap-6 dark:bg-slate-900/80 bg-white/80 border border-slate-200 dark:border-white/10 shadow-2xl">

                        <div className="flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4 border border-white/10">
                                <span className="material-symbols-outlined text-primary text-2xl">lock_reset</span>
                            </div>
                            <h1 className="text-slate-900 dark:text-white tracking-tight text-2xl font-bold mb-2">Reset Password</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm text-center">{error}</div>
                        )}

                        <form className="flex flex-col gap-4" onSubmit={handleForgotPassword}>
                            <div className="space-y-2">
                                <label className="text-slate-600 dark:text-slate-300 text-sm font-medium ml-1" htmlFor="reset-email">Email</label>
                                <input
                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-3.5 text-slate-900 dark:text-white focus:border-emerald-500 dark:focus:border-primary focus:ring-1 focus:ring-emerald-500 dark:focus:ring-primary focus:outline-none transition-all text-sm font-medium"
                                    id="reset-email"
                                    placeholder="name@example.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-primary hover:from-emerald-400 hover:to-cyan-400 text-white dark:text-slate-900 font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>

                        <button
                            onClick={() => { setIsForgotPassword(false); setError(''); }}
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors text-center"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-4 font-display transition-colors duration-300 overflow-hidden">
            {/* Main Container */}
            <div className="relative w-full max-w-md">
                {/* Abstract Background Glows */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-500/10 dark:bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                {/* Auth Card */}
                <div className="glass-card relative w-full rounded-[24px] p-6 sm:p-8 md:p-10 flex flex-col gap-6 dark:bg-slate-900/80 bg-white/80 border border-slate-200 dark:border-white/10 shadow-2xl dark:shadow-none transition-all duration-300">

                    {/* 1. App Logo */}
                    <div className="flex flex-col items-center justify-center">

                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-primary flex items-center justify-center shadow-lg shadow-emerald-500/20 dark:shadow-primary/20">
                                <span className="material-symbols-outlined text-white dark:text-slate-900 text-xl font-bold">account_balance_wallet</span>
                            </div>
                            <h1 className="text-slate-900 dark:text-white tracking-tight text-2xl font-bold">FinDash</h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {isLogin ? "Manage your finances with clarity." : "Start your financial journey today."}
                        </p>
                    </div>

                    {/* 2. Tab Switcher */}
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-200 dark:border-white/5">
                        <div className="grid grid-cols-2 gap-1">
                            <button
                                onClick={() => { setIsLogin(true); setError(''); }}
                                className={`flex items-center justify-center py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${isLogin
                                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-primary text-white dark:text-slate-900 font-semibold shadow-md'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'}`}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => { setIsLogin(false); setError(''); }}
                                className={`flex items-center justify-center py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${!isLogin
                                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-primary text-white dark:text-slate-900 font-semibold shadow-md'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'}`}
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* 3. Dynamic Form */}
                    {isLogin ? (
                        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-slate-600 dark:text-slate-300 text-sm font-medium ml-1" htmlFor="email">Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-primary transition-colors">mail</span>
                                    </div>
                                    <input
                                        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 pl-11 pr-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-primary focus:ring-1 focus:ring-emerald-500 dark:focus:ring-primary focus:outline-none transition-all text-sm font-medium"
                                        id="email"
                                        placeholder="name@example.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            {/* Password Field */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-slate-600 dark:text-slate-300 text-sm font-medium" htmlFor="password">Password</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsForgotPassword(true)}
                                        className="text-xs text-emerald-600 dark:text-primary hover:text-emerald-700 dark:hover:text-primary-dark transition-colors font-medium"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-primary transition-colors">lock</span>
                                    </div>
                                    <input
                                        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 pl-11 pr-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-primary focus:ring-1 focus:ring-emerald-500 dark:focus:ring-primary focus:outline-none transition-all text-sm font-medium"
                                        id="password"
                                        placeholder="Enter your password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-primary hover:from-emerald-400 hover:to-cyan-400 dark:hover:from-emerald-300 dark:hover:to-cyan-300 text-white dark:text-slate-900 font-bold py-3.5 px-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] dark:shadow-[0_0_20px_rgba(19,236,236,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] dark:hover:shadow-[0_0_25px_rgba(19,236,236,0.5)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                                        SIGNING IN...
                                    </>
                                ) : (
                                    <>
                                        LOGIN <span className="material-symbols-outlined text-lg font-bold">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                            {/* Full Name Field */}
                            <div className="space-y-2">
                                <label className="text-slate-600 dark:text-slate-300 text-sm font-medium ml-1" htmlFor="fullname">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-primary transition-colors">person</span>
                                    </div>
                                    <input
                                        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 pl-11 pr-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-primary focus:ring-1 focus:ring-emerald-500 dark:focus:ring-primary focus:outline-none transition-all text-sm font-medium"
                                        id="fullname"
                                        placeholder="John Doe"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-slate-600 dark:text-slate-300 text-sm font-medium ml-1" htmlFor="email">Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-primary transition-colors">mail</span>
                                    </div>
                                    <input
                                        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 pl-11 pr-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-primary focus:ring-1 focus:ring-emerald-500 dark:focus:ring-primary focus:outline-none transition-all text-sm font-medium"
                                        id="email"
                                        placeholder="name@example.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-slate-600 dark:text-slate-300 text-sm font-medium ml-1" htmlFor="password">Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 dark:group-focus-within:text-primary transition-colors">lock</span>
                                    </div>
                                    <input
                                        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 pl-11 pr-4 py-3.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 dark:focus:border-primary focus:ring-1 focus:ring-emerald-500 dark:focus:ring-primary focus:outline-none transition-all text-sm font-medium"
                                        id="password"
                                        placeholder="Create a password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>
                            {/* Sign Up Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-primary hover:from-emerald-400 hover:to-cyan-400 dark:hover:from-emerald-300 dark:hover:to-cyan-300 text-white dark:text-slate-900 font-bold py-3.5 px-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] dark:shadow-[0_0_20px_rgba(19,236,236,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] dark:hover:shadow-[0_0_25px_rgba(19,236,236,0.5)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                                        CREATING ACCOUNT...
                                    </>
                                ) : (
                                    <>
                                        CREATE ACCOUNT <span className="material-symbols-outlined text-lg font-bold">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Divider */}
                    <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-500 dark:text-slate-500 text-xs font-medium uppercase tracking-wider">Or continue with</span>
                        <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                    </div>

                    {/* Terms Checkbox - Only for Sign Up */}
                    {!isLogin && (
                        <div className="flex items-start gap-2 px-1">
                            <div className="relative flex items-center">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) => {
                                        setAcceptedTerms(e.target.checked);
                                        if (e.target.checked) setError('');
                                    }}
                                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer mt-1"
                                />
                            </div>
                            <label htmlFor="terms" className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed cursor-pointer select-none">
                                I accept the <a href="#" className="font-bold text-slate-900 dark:text-white hover:underline">Terms of Service</a> and <a href="#" className="font-bold text-slate-900 dark:text-white hover:underline">Privacy Policy</a>. required to sign up.
                            </label>
                        </div>
                    )}

                    {/* 5. Social Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                handleGoogleLogin();
                            }}
                            className={`flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-3 rounded-xl transition-all hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-900 dark:text-white cursor-pointer`}
                        >
                            <svg className="w-5 h-5" data-alt="Google Logo" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                            </svg>
                            <span className="text-sm font-medium">Google</span>
                        </button>
                        <button
                            onClick={() => {
                                handleAppleLogin();
                            }}
                            className={`flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-3 rounded-xl transition-all hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-900 dark:text-white cursor-pointer`}
                        >
                            <svg className="w-5 h-5 text-current fill-current" data-alt="Apple Logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.1 2.69-.88 3.86-.68 1.54.26 2.8 1.25 3.52 2.5-3.22 1.66-2.58 6.42.74 7.74-.53 1.25-1.22 2.5-2.12 3.31-.08-.1-.13-.2-.18-.3zm-2.92-16c-.22 1.56-1.48 2.8-2.9 2.9-.38-1.6 1.14-3.22 2.9-2.9z"></path>
                            </svg>
                            <span className="text-sm font-medium">Apple</span>
                        </button>
                    </div>

                    <div className="text-center pt-2">
                        {isLogin ? (
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Don't have an account? <button onClick={() => { setIsLogin(false); setError(''); }} className="text-emerald-500 dark:text-primary hover:text-emerald-600 dark:hover:text-white transition-colors font-medium">Sign up</button></p>
                        ) : (
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Already have an account? <button onClick={() => { setIsLogin(true); setError(''); }} className="text-emerald-500 dark:text-primary hover:text-emerald-600 dark:hover:text-white transition-colors font-medium">Login</button></p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

}
