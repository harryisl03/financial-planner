import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, AreaChart, Area, ResponsiveContainer } from 'recharts';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';
import { useTotalBalance, useAccounts } from '../hooks/useAccounts';
import { useSummary, useSpendingByCategory, useBalanceHistory } from '../hooks/useStats';
import { useTransactions } from '../hooks/useTransactions';
import { useUser } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';
import LinkBankModal from './LinkBankModal';
import AddTransactionModal from './AddTransactionModal';
import TransactionDetailsModal from './TransactionDetailsModal';

export default function Dashboard() {
    const navigate = useNavigate();
    const { formatCurrency, t } = usePreferences();
    const { user } = useAuth();

    // Fetch user data including profile updates
    const { data: userData } = useUser();
    // Use userData if available (from React Query cache), otherwise fallback to auth user
    const currentUser = userData || user;

    const [isLinkBankOpen, setIsLinkBankOpen] = useState(false);
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
    const [viewingTransaction, setViewingTransaction] = useState(null);
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
    const [spendingPeriod, setSpendingPeriod] = useState('month'); // 'month' or 'lastMonth'

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch data from API
    const { data: balanceData, isLoading: balanceLoading } = useTotalBalance();
    const { data: accounts, isLoading: accountsLoading } = useAccounts();
    const { data: summary, isLoading: summaryLoading } = useSummary(spendingPeriod);
    const { data: spendingByCategory, isLoading: spendingLoading } = useSpendingByCategory(spendingPeriod);
    const { data: transactionsData, isLoading: transactionsLoading } = useTransactions({ limit: 6 });
    const { data: balanceHistory } = useBalanceHistory('month');


    // Calculate total spending
    const totalSpending = useMemo(() => spendingByCategory?.reduce((acc, cat) => acc + cat.amount, 0) || 0, [spendingByCategory]);

    // Get user's first name for greeting
    const firstName = currentUser?.name?.split(' ')[0] || 'User';

    // Format current date
    const today = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });


    // Loading skeleton component
    const Skeleton = ({ className }) => (
        <div className={`animate-pulse bg-slate-700/50 rounded ${className}`}></div>
    );

    // Use balance history data from useBalanceHistory hook (same as Statistics page)
    const chartData = useMemo(() => {
        if (balanceHistory && Array.isArray(balanceHistory) && balanceHistory.length > 0) {
            return balanceHistory;
        }
        // Generate sample data for chart visualization when no data
        const currentBalance = balanceData?.totalBalance || 0;
        const sampleData = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const variation = (Math.random() - 0.5) * (currentBalance * 0.1);
            sampleData.push({
                period: date.toISOString().split('T')[0],
                label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                balance: Math.max(0, currentBalance + variation * (30 - i) / 30)
            });
        }
        return sampleData;
    }, [balanceHistory, balanceData?.totalBalance]);

    // Get icon based on category name
    const getCategoryIcon = (categoryName) => {
        const icons = {
            'food': 'restaurant',
            'food & drink': 'coffee',
            'transport': 'directions_car',
            'transportation': 'directions_car',
            'shopping': 'shopping_bag',
            'entertainment': 'movie',
            'health': 'fitness_center',
            'utilities': 'bolt',
            'salary': 'work',
            'income': 'trending_up',
            'default': 'category'
        };
        const key = categoryName?.toLowerCase() || 'default';
        return icons[key] || icons['default'];
    };

    // Account type icons
    const getAccountIcon = (type) => {
        const icons = {
            'bank': 'account_balance',
            'ewallet': 'account_balance_wallet',
            'cash': 'payments',
            'credit_card': 'credit_card'
        };
        return icons[type] || 'account_balance';
    };

    return (
        <>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">Hi, {firstName}! 👋</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{today}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAddTransactionOpen(true)}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-900 px-4 py-2.5 rounded-xl font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span className="hidden sm:inline">{t('Add Transaction')}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8 flex flex-col gap-6">
                    {/* Total Balance Card */}
                    <div className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-8 shadow-2xl">
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#10B981]/10 blur-3xl pointer-events-none"></div>
                        <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-[#06B6D4]/5 blur-3xl pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 items-start md:items-end">
                            <div className="flex-1">
                                <p className="text-slate-600 dark:text-slate-400 font-medium text-sm mb-2">{t('Total Balance')}</p>
                                {balanceLoading ? (
                                    <Skeleton className="h-12 w-48 mb-8" />
                                ) : (
                                    <h2 className="text-5xl font-bold gradient-text-primary tracking-tight mb-8">
                                        {formatCurrency(balanceData?.totalBalance || 0)}
                                    </h2>
                                )}
                                <div className="flex gap-4">
                                    <div className="flex flex-col gap-1 rounded-xl bg-white/50 dark:bg-slate-900/40 p-4 border border-slate-200 dark:border-white/5 min-w-[150px]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex size-6 items-center justify-center rounded-full bg-[#10B981]/20 text-[#10B981]">
                                                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                                            </div>
                                            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('Income')}</span>
                                        </div>
                                        {summaryLoading ? (
                                            <Skeleton className="h-7 w-24" />
                                        ) : (
                                            <span className="text-xl font-bold text-slate-900 dark:text-slate-50">+{formatCurrency(summary?.income || 0)}</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1 rounded-xl bg-white/50 dark:bg-slate-900/40 p-4 border border-slate-200 dark:border-white/5 min-w-[150px]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="flex size-6 items-center justify-center rounded-full bg-[#F43F5E]/20 text-[#F43F5E]">
                                                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                                            </div>
                                            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('Expense')}</span>
                                        </div>
                                        {summaryLoading ? (
                                            <Skeleton className="h-7 w-24" />
                                        ) : (
                                            <span className="text-xl font-bold text-slate-900 dark:text-slate-50">-{formatCurrency(summary?.expense || 0)}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="hidden md:block h-32 w-80 -mb-4">
                                {/* Only render chart on desktop to avoid Recharts display:none warnings */}
                                <div className="hidden md:block h-full w-full">
                                    {isDesktop && (
                                        <AreaChart width={320} height={128} data={chartData}>
                                            <defs>
                                                <linearGradient id="miniChartGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area
                                                type="monotone"
                                                dataKey="balance"
                                                stroke="#10B981"
                                                strokeWidth={2}
                                                fill="url(#miniChartGradient)"
                                                isAnimationActive={false}
                                            />
                                        </AreaChart>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* My Accounts */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{t('My Accounts')}</h3>
                            <button onClick={() => navigate('/settings')} className="text-sm font-medium text-[#10B981] hover:text-[#06B6D4] transition-colors cursor-pointer">{t('Manage')}</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {accountsLoading ? (
                                <>
                                    <Skeleton className="h-32 rounded-3xl" />
                                    <Skeleton className="h-32 rounded-3xl" />
                                    <Skeleton className="h-32 rounded-3xl" />
                                </>
                            ) : accounts && accounts.length > 0 ? (
                                accounts.slice(0, 3).map((account) => (
                                    <div key={account.id} className="group relative flex flex-col justify-between overflow-hidden rounded-3xl glass-card p-5 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all cursor-pointer">
                                        <div className="mb-5 flex items-start justify-between">
                                            <div className="size-10 rounded-xl bg-[#10B981]/10 p-2 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[#10B981] text-lg">{getAccountIcon(account.type)}</span>
                                            </div>
                                            {account.accountNumber && (
                                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">****{account.accountNumber.slice(-4)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{account.name}</p>
                                            <p className="text-xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(account.balance)}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-3 text-center py-8 text-slate-500 dark:text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">account_balance_wallet</span>
                                    <p>No accounts yet. Add your first account to get started!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Spending This Month */}
                    <div className="rounded-3xl glass-card p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{spendingPeriod === 'month' ? t('Spending This Month') : t('Spending Last Month')}</h3>
                            <select
                                value={spendingPeriod}
                                onChange={(e) => setSpendingPeriod(e.target.value)}
                                className="bg-white dark:bg-slate-800 text-sm text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-xl py-1 px-3 outline-none focus:ring-1 focus:ring-[#10B981] cursor-pointer"
                            >
                                <option value="month">{t('This Month')}</option>
                                <option value="lastMonth">{t('Last Month')}</option>
                            </select>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="relative size-52 flex-shrink-0 flex items-center justify-center">
                                {spendingLoading ? (
                                    <Skeleton className="w-full h-full rounded-full" />
                                ) : (
                                    <div className="w-full h-full relative">
                                        <PieChart width={208} height={208}>
                                            <Pie
                                                data={spendingByCategory || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="amount"
                                                stroke="none"
                                                onMouseEnter={(_, index) => setHoveredCategory(spendingByCategory[index])}
                                                onMouseLeave={() => setHoveredCategory(null)}
                                            >
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'var(--tooltip-bg, rgba(30, 41, 59, 0.9))',
                                                        backdropFilter: 'blur(8px)',
                                                        border: '1px solid var(--tooltip-border, rgba(255, 255, 255, 0.1))',
                                                        borderRadius: '16px',
                                                        color: 'var(--tooltip-text, #fff)',
                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                                        padding: '12px'
                                                    }}
                                                    cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                    formatter={(value, name) => [
                                                        <span className="font-bold font-mono">{formatCurrency(value)}</span>,
                                                        <span className="text-slate-300 capitalize">{name === 'income' ? t('Income') : t('Expense')}</span>
                                                    ]}
                                                    labelStyle={{ color: '#94A3B8', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                                />
                                                {spendingByCategory?.map((entry, index) => {
                                                    const colors = ['#10B981', '#06B6D4', '#F43F5E', '#8B5CF6', '#F59E0B'];
                                                    return <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} strokeWidth={0} />;
                                                })}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                                                    backdropFilter: 'blur(8px)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '16px',
                                                    color: '#fff',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                                    padding: '12px'
                                                }}
                                                cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                formatter={(value, name) => [
                                                    <span className="font-bold font-mono">{formatCurrency(value)}</span>,
                                                    <span className="text-slate-300 capitalize">{name === 'income' ? t('Income') : t('Expense')}</span>
                                                ]}
                                                labelStyle={{ color: '#94A3B8', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                            />
                                        </PieChart>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-2xl font-bold text-slate-900 dark:text-slate-50 transition-all duration-300">
                                                {hoveredCategory ? formatCurrency(hoveredCategory.amount) : formatCurrency(totalSpending)}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1 transition-all duration-300 truncate max-w-[120px]">
                                                {hoveredCategory ? hoveredCategory.name : 'Total'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 w-full space-y-5">
                                {spendingLoading ? (
                                    <>
                                        <Skeleton className="h-6 w-full" />
                                        <Skeleton className="h-6 w-full" />
                                        <Skeleton className="h-6 w-full" />
                                        <Skeleton className="h-6 w-full" />
                                    </>
                                ) : spendingByCategory && spendingByCategory.length > 0 ? (
                                    spendingByCategory.slice(0, 4).map((category, idx) => {
                                        const colors = ['#10B981', '#06B6D4', '#F43F5E', '#8B5CF6'];
                                        const color = category.color || colors[idx % colors.length];
                                        const percentage = totalSpending > 0 ? Math.round((category.amount / totalSpending) * 100) : 0;
                                        return (
                                            <div key={category.id || idx} className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-3 rounded-full" style={{ backgroundColor: color }}></div>
                                                    <span className="text-sm font-medium text-slate-900 dark:text-slate-50">{category.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3 flex-1 justify-end">
                                                    <div className="h-2 w-32 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-white/5">
                                                        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-50 w-10 text-right">{percentage}%</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                                        <p>No spending data for this month</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Transactions */}
                <div className="xl:col-span-4 flex flex-col h-full">
                    <div className="flex h-full flex-col rounded-3xl glass-card">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 p-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{t('Recent Transactions')}</h3>
                            <button onClick={() => navigate('/transactions')} className="text-sm font-medium text-[#10B981] hover:text-[#06B6D4] transition-colors cursor-pointer">{t('View All')}</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {transactionsLoading ? (
                                <>
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                </>
                            ) : transactionsData?.data && transactionsData.data.length > 0 ? (
                                transactionsData.data.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        onClick={() => setViewingTransaction(transaction)}
                                        className="group flex items-center justify-between rounded-xl p-3 hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/5"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`size-10 rounded-full flex items-center justify-center ${transaction.type === 'income'
                                                ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500/20'
                                                } transition-colors`}>
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {transaction.category?.icon || (transaction.type === 'income' ? 'trending_up' : 'trending_down')}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{transaction.description || t('No Description')}</p>
                                                <p className="text-xs text-slate-600 dark:text-slate-400">{transaction.category?.name || t('Uncategorized')}</p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-bold ${transaction.type === 'income' ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-50'
                                            }`}>
                                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount || 0)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                    <p>{t('No recent transactions')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Modals */}
            <LinkBankModal
                isOpen={isLinkBankOpen}
                onClose={() => setIsLinkBankOpen(false)}
            />

            <AddTransactionModal
                isOpen={isAddTransactionOpen}
                onClose={() => setIsAddTransactionOpen(false)}
            />

            <TransactionDetailsModal
                isOpen={!!viewingTransaction}
                onClose={() => setViewingTransaction(null)}
                transaction={viewingTransaction}
            />
        </>
    );
}
