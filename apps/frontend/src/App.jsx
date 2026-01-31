import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from './context/SidebarContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Budget from './components/Budget';
import Statistics from './components/Statistics';
import Transactions from './components/Transactions';
import Settings from './components/Settings';
import Login from './components/Login';
import Billing from './components/Billing';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient();

// INTERNAL DIAGNOSTIC COMPONENT
function BackendStatusChecker({ apiUrl }) {
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

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                    <ProtectedRoute>
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                } />
                <Route path="/statistics" element={
                    <ProtectedRoute>
                        <Layout>
                            <Statistics />
                        </Layout>
                    </ProtectedRoute>
                } />
                <Route path="/budget" element={
                    <ProtectedRoute>
                        <Layout>
                            <Budget />
                        </Layout>
                    </ProtectedRoute>
                } />
                <Route path="/transactions" element={
                    <ProtectedRoute>
                        <Layout>
                            <Transactions />
                        </Layout>
                    </ProtectedRoute>
                } />
                <Route path="/settings" element={
                    <ProtectedRoute>
                        <Layout>
                            <Settings />
                        </Layout>
                    </ProtectedRoute>
                } />
                <Route path="/billing" element={
                    <ProtectedRoute>
                        <Layout>
                            <Billing />
                        </Layout>
                    </ProtectedRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
