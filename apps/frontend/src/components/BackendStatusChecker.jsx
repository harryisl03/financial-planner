import React from 'react';

// INTERNAL DIAGNOSTIC COMPONENT
export default function BackendStatusChecker({ apiUrl }) {
    const [status, setStatus] = React.useState({ loading: true, data: null, error: null });

    React.useEffect(() => {
        if (!apiUrl) return;
        const check = async () => {
            try {
                // Ensure no double slash, but handled by replace usually.
                const cleanUrl = apiUrl.replace(/\/$/, "");
                const res = await fetch(`${cleanUrl}/api/health/db`);
                const data = await res.json();
                setStatus({ loading: false, data, error: null });
            } catch (err) {
                setStatus({ loading: false, data: null, error: err.message });
            }
        };
        check();
    }, [apiUrl]);

    if (!apiUrl) return null; // Handled by outer check

    return (
        <div className="w-full mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-1 border-b border-slate-200 pb-1">
                <span className="text-slate-500">System Status</span>
                {status.loading ? <span className="animate-pulse">Checking...</span> :
                    status.error ? <span className="text-red-500 font-bold">OFFLINE</span> :
                        <span className="text-emerald-500 font-bold">ONLINE</span>}
            </div>

            {!status.loading && status.data && (
                <div className="space-y-1 mt-1">
                    <div className="flex justify-between">
                        <span>DB Connection:</span>
                        <span>{status.data.db === 'connected' ? '✅ OK' : '❌ FAIL'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Users Table:</span>
                        <span>{status.data.schema === 'ok' ? `✅ Found (${status.data.userCount})` : '❌ MISSING'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Auth Secret:</span>
                        <span>{status.data.env?.BETTER_AUTH_SECRET}</span>
                    </div>
                </div>
            )}

            {status.error && (
                <div className="text-red-400 mt-1">Failed to connect to backend.</div>
            )}
        </div>
    );
}
