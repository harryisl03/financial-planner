import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AuthError = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    const getErrorDetails = (errorCode) => {
        switch (errorCode) {
            case 'state_mismatch':
                return {
                    title: 'State Mismatch Error',
                    message: 'The security state verification failed. This usually happens for one of two reasons:',
                    solutions: [
                        'The "Authorized redirect URI" in your Google Cloud Console is incorrect.',
                        'Make sure it is EXACTLY: https://financial-planner-api.onrender.com/api/auth/callback/google',
                        'Note: It must use the BACKEND URL (api), not the frontend URL.',
                        'You might be using HTTP instead of HTTPS in the configuration.'
                    ]
                };
            case 'access_denied':
                return {
                    title: 'Access Denied',
                    message: 'You cancelled the login process or Google declined access.',
                    solutions: ['Try signing in again.']
                };
            case 'configuration_error':
                return {
                    title: 'Configuration Error',
                    message: 'The backend could not handle the authentication request.',
                    solutions: [
                        'Check environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET).',
                        'Ensure BETTER_AUTH_URL is set correctly on the backend.',
                        'Ensure TRUST_PROXY is enabled if behind a proxy (like Render).'
                    ]
                };
            default:
                return {
                    title: 'Authentication Failed',
                    message: errorDescription || 'An unknown error occurred during sign in.',
                    solutions: ['Try clearing your browser cookies and cache.', 'Try using Incognito mode.', 'Check the browser console for more details.']
                };
        }
    };

    const info = getErrorDetails(error);

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center p-4 font-display transition-colors duration-300 overflow-hidden">
            {/* Main Container */}
            <div className="relative w-full max-w-lg">
                {/* Abstract Background Glows */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-red-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-500/10 dark:bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="glass-card relative w-full rounded-[24px] p-6 sm:p-8 md:p-10 flex flex-col gap-6 dark:bg-slate-900/80 bg-white/80 border border-slate-200 dark:border-white/10 shadow-2xl dark:shadow-none transition-all duration-300">

                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-6 border border-red-100 dark:border-red-500/10">
                            <span className="material-symbols-outlined text-red-500 text-3xl">error_outline</span>
                        </div>

                        <h1 className="text-slate-900 dark:text-white tracking-tight text-2xl font-bold mb-2">
                            {info.title}
                        </h1>

                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-500/10 rounded-xl p-4 w-full mb-6">
                            <p className="text-red-600 dark:text-red-400 font-mono text-sm break-all">
                                code: {error || 'unknown_error'}
                            </p>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                            {info.message}
                        </p>

                        {info.solutions.length > 0 && (
                            <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-white/5 text-left">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Possible Solutions</h3>
                                <ul className="space-y-3">
                                    {info.solutions.map((solution, index) => (
                                        <li key={index} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                            <span className="material-symbols-outlined text-emerald-500 text-lg flex-shrink-0 mt-0.5">check_circle</span>
                                            <span>{solution}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
                        >
                            Return to Login
                        </button>
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="w-full bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold py-3.5 px-6 rounded-xl transition-all"
                        >
                            Hard Reload & Retry
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AuthError;
