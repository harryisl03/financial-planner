import React, { useState, useEffect } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import { authClient } from '../lib/auth-client';
import { UAParser } from 'ua-parser-js';

export default function ActiveSessions() {
    const { t } = usePreferences();
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);



    // Better approach: use a standard fetch with credentials, or axios if used elsewhere.
    // The project seems to use fetch or axios. Let's check services.
    // I'll stick to a simple fetch with credentials for now, or check how other services do it.

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        setIsLoading(true);
        try {
            // We need to pass the session token. Better-auth client stores it in cookies usually.
            // If using bearer token, we might need to get it from authClient.
            // Let's assume cookie based for now as per better-auth default.

            // Wait, better-auth client might not expose the token easily if httpOnly. 
            // The backend endpoint checks `auth.api.getSession({ headers: req.headers })`.
            // So we just need to send cookies.

            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/sessions`, {
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to fetch sessions');

            const data = await response.json();
            setSessions(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevoke = async (sessionId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/sessions/${sessionId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to revoke session: ${response.status} ${errorText}`);
            }

            // Remove from state
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (err) {
            console.error('Revoke failed:', err);
            setError(`Revoke failed: ${err.message}`); // Show to user? Maybe just log for now or show toast
            // Optionally show toast
        }
    };

    const parseUA = (uaString) => {
        const parser = new UAParser(uaString);
        return parser.getResult();
    };

    const getDeviceIcon = (type, os) => {
        if (type === 'mobile' || type === 'tablet') return 'smartphone';
        if (os?.toLowerCase().includes('mac') || os?.toLowerCase().includes('windows')) return 'laptop';
        return 'devices';
    };

    if (isLoading) return <div className="p-4 text-center text-slate-500">Loading sessions...</div>;
    if (error) return <div className="p-4 text-center text-rose-500">Error loading sessions</div>;

    return (
        <div className="bg-white dark:bg-slate-900 mx-6 rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm mt-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('Active Sessions')}</h3>
            <div className="space-y-4">
                {sessions.map(session => {
                    const ua = parseUA(session.userAgent);
                    const isCurrent = session.isCurrent;
                    const icon = getDeviceIcon(ua.device.type, ua.os.name);

                    return (
                        <div key={session.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-4">
                                <div className={`size-10 rounded-full flex items-center justify-center ${isCurrent ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                    <span className="material-symbols-outlined">{icon}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                                            {ua.browser.name || 'Unknown Browser'} on {ua.os.name || 'Unknown OS'}
                                        </p>
                                        {isCurrent && <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">{t('Current Session')}</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {ua.device.vendor} {ua.device.model} • {session.ipAddress || 'Unknown IP'} • Last active: {new Date(session.updatedAt || session.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            {!isCurrent && (
                                <button
                                    onClick={() => handleRevoke(session.id)}
                                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {t('Revoke')}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
