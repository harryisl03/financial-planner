import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Budget from './components/Budget';
import Statistics from './components/Statistics';
import Transactions from './components/Transactions';
import Settings from './components/Settings';
import Login from './components/Login';
import Billing from './components/Billing';
import ProtectedRoute from './components/ProtectedRoute';

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
