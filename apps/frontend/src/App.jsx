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
import AuthError from './components/AuthError';

import Billing from './components/Billing';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/auth-error" element={<AuthError />} />
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
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
