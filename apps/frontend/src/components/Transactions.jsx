import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { usePreferences } from '../context/PreferencesContext';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useAccounts } from '../hooks/useAccounts';
import { useSummary } from '../hooks/useStats';
import AddTransactionModal from './AddTransactionModal';
import EditTransactionModal from './EditTransactionModal';

export default function Transactions() {
    const { toggleSidebar } = useSidebar();
    const { t, formatCurrency } = usePreferences();
    const [searchParams] = useSearchParams();
    const [filters, setFilters] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Read search from URL params
    useEffect(() => {
        const urlSearch = searchParams.get('search');
        if (urlSearch) {
            setSearchQuery(urlSearch);
        }
    }, [searchParams]);

    // Date range filter state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Amount range filter state
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');

    // Fetch data from API
    const { data: transactionsData, isLoading: transactionsLoading } = useTransactions(filters);
    const { data: categories, isLoading: categoriesLoading } = useCategories();
    const { data: accounts, isLoading: accountsLoading } = useAccounts();
    const { data: summary, isLoading: summaryLoading } = useSummary('month');

    const transactions = Array.isArray(transactionsData) ? transactionsData : transactionsData?.data || [];

    // Export to CSV function
    const handleExport = async () => {
        setIsExporting(true);
        try {
            const csvContent = [
                ['Date', 'Description', 'Category', 'Account', 'Type', 'Amount'].join(','),
                ...transactions.map(t => [
                    new Date(t.date).toLocaleDateString(),
                    `"${t.description?.replace(/"/g, '""') || ''}"`,
                    t.category?.name || 'Uncategorized',
                    t.account?.name || 'Unknown',
                    t.type,
                    t.type === 'expense' ? -t.amount : t.amount
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    // Skeleton component
    const Skeleton = ({ className }) => (
        <div className={`animate-pulse bg-slate-700/50 rounded ${className}`}></div>
    );

    // Filter transactions by all criteria
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            // Search query filter
            if (searchQuery && !(
                t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            )) {
                return false;
            }

            // Date range filter
            if (startDate) {
                const txDate = new Date(t.date);
                const filterStart = new Date(startDate);
                if (txDate < filterStart) return false;
            }
            if (endDate) {
                const txDate = new Date(t.date);
                const filterEnd = new Date(endDate);
                filterEnd.setHours(23, 59, 59, 999);
                if (txDate > filterEnd) return false;
            }

            // Amount range filter
            if (minAmount && t.amount < parseFloat(minAmount)) return false;
            if (maxAmount && t.amount > parseFloat(maxAmount)) return false;

            return true;
        });
    }, [transactions, searchQuery, startDate, endDate, minAmount, maxAmount]);

    const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
        const date = new Date(transaction.date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
        if (!groups[date]) {
            groups[date] = { transactions: [], total: 0 };
        }
        groups[date].transactions.push(transaction);
        const amount = parseFloat(transaction.amount) || 0;
        groups[date].total += transaction.type === 'expense' ? -amount : amount;
        return groups;
    }, {});

    // Icon mapping for categories
    const getCategoryIcon = (categoryName) => {
        const icons = {
            'groceries': 'shopping_cart', 'grocery': 'shopping_cart',
            'salary': 'work', 'income': 'trending_up',
            'dining': 'local_cafe', 'coffee': 'local_cafe', 'cafe': 'local_cafe',
            'utilities': 'bolt', 'electric': 'bolt',
            'entertainment': 'movie', 'netflix': 'movie', 'streaming': 'movie',
            'transport': 'directions_car', 'uber': 'directions_car',
            'shopping': 'shopping_bag',
            'food': 'restaurant', 'food & dining': 'restaurant'
        };
        return icons[categoryName?.toLowerCase()] || 'receipt_long';
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50 dark:bg-slate-900">
            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-10 relative bg-slate-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 custom-scrollbar">
                    <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 relative z-10">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t('Transactions')}</h2>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">{t('View and manage your financial activity across all accounts.')}</p>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                            {/* Mobile Filter Toggle */}
                            <button
                                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                                className="lg:hidden glass-panel rounded-lg px-4 py-3 shadow-lg flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                                <span className="text-sm font-medium">{t('Filters')}</span>
                            </button>

                            {/* Mobile Add Transaction Button */}
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                <span>{t('Add')}</span>
                            </button>
                            <div className="glass-panel rounded-lg px-5 py-3 shadow-lg">
                                <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider mb-0.5">{t('Income')}</p>
                                {summaryLoading ? (
                                    <Skeleton className="h-7 w-24" />
                                ) : (
                                    <p className="text-emerald-400 font-bold text-lg">+{formatCurrency(summary?.income || 0)}</p>
                                )}
                            </div>
                            <div className="glass-panel rounded-lg px-5 py-3 shadow-lg">
                                <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider mb-0.5">{t('Expense')}</p>
                                {summaryLoading ? (
                                    <Skeleton className="h-7 w-24" />
                                ) : (
                                    <p className="text-rose-400 font-bold text-lg">-{formatCurrency(summary?.expense || 0)}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Transaction List */}
                    {transactionsLoading ? (
                        <div className="space-y-8 relative z-10">
                            {Array(2).fill(0).map((_, groupIdx) => (
                                <div key={groupIdx} className="mb-8">
                                    <div className="flex items-center justify-between mb-4 py-3 border-b border-slate-200 dark:border-white/5">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-5 w-20" />
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {Array(3).fill(0).map((_, idx) => (
                                            <div key={idx} className="glass-panel rounded-xl p-4 flex items-center gap-4">
                                                <Skeleton className="size-12 rounded-xl" />
                                                <div className="flex-1">
                                                    <Skeleton className="h-5 w-40 mb-2" />
                                                    <Skeleton className="h-4 w-24" />
                                                </div>
                                                <Skeleton className="h-6 w-24" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : Object.keys(groupedTransactions).length > 0 ? (
                        Object.entries(groupedTransactions).map(([date, group]) => (
                            <div key={date} className="mb-8 relative z-10">
                                <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md z-20 py-3 border-b border-slate-200 dark:border-white/5 -mx-2 px-2">
                                    <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{date}</h3>
                                    <span className={`text-xs font-medium px-2 py-1 rounded border border-slate-200 dark:border-white/5 ${group.total >= 0 ? 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10' : 'text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50'
                                        }`}>
                                        {group.total >= 0 ? '+' : ''}{formatCurrency(group.total)}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {group.transactions.map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            onClick={() => setEditingTransaction(transaction)}
                                            className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col sm:flex-row gap-4 transition-all duration-200 group cursor-pointer shadow-sm hover:shadow-md"
                                        >
                                            {/* Mobile: Top Row (Icon + Description + Amount) | Desktop: Icon + Description */}
                                            <div className="flex items-start gap-4 flex-1 w-full">
                                                <div className="size-10 sm:size-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all shadow-inner">
                                                    <span className="material-symbols-outlined text-[20px] sm:text-[24px]">{getCategoryIcon(transaction.category?.name)}</span>
                                                </div>

                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <p className="text-slate-900 dark:text-white font-medium text-base truncate pr-2 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{transaction.description}</p>
                                                        {/* Mobile Amount visible here */}
                                                        <span className={`sm:hidden font-bold font-mono text-base tracking-tight whitespace-nowrap ${transaction.type === 'income' ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-900 dark:text-rose-400'}`}>
                                                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                        {/* Mobile Details Group */}
                                                        <span className="truncate max-w-[100px] sm:max-w-none">{new Date(transaction.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                                                        <span className="size-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                                                        <span className="truncate max-w-[120px] sm:max-w-none">{transaction.account?.name || 'Unknown'}</span>
                                                        <span className="size-1 bg-slate-300 dark:bg-slate-600 rounded-full sm:hidden"></span>
                                                        <span className={`px-1.5 py-0.5 rounded border ${transaction.type === 'income'
                                                            ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20'
                                                            : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5'
                                                            }`}>{transaction.category?.name || 'Uncategorized'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Desktop: Amount + Account (Right aligned) - Hidden on Mobile */}
                                            <div className="hidden sm:flex items-center justify-end gap-6">
                                                <span className="text-slate-500 dark:text-slate-500 text-[11px] font-semibold uppercase tracking-wide">{transaction.account?.name || 'Unknown'}</span>
                                                <p className={`font-bold font-mono text-lg tracking-tight ${transaction.type === 'income' ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-900 dark:text-rose-400'
                                                    }`}>
                                                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400 relative z-10">
                            <span className="material-symbols-outlined text-5xl mb-4 opacity-50">receipt_long</span>
                            <p className="text-lg font-medium">{t('No transactions yet')}</p>
                            <p className="text-sm mt-1">{t('Add your first transaction to get started')}</p>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="mt-4 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-900 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                {t('Add Transaction')}
                            </button>
                        </div>
                    )}

                    {transactions.length > 0 && (
                        <div className="flex justify-center mt-6 mb-12 relative z-10">
                            <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10 shadow-sm">
                                Load More Transactions
                            </button>
                        </div>
                    )}
                </main>

                {/* Mobile Overlay Background */}
                {isFiltersOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setIsFiltersOpen(false)}
                    />
                )}

                {/* Filters Sidebar */}
                <aside className={`
                    w-80 glass-sidebar overflow-y-auto flex-col p-6 gap-8 border-l border-slate-200 dark:border-white/5
                    lg:relative lg:flex lg:shrink-0 lg:z-0 lg:transform-none
                    fixed right-0 top-0 h-full z-40
                    transition-transform duration-300 ease-in-out
                    ${isFiltersOpen ? 'translate-x-0 flex' : 'translate-x-full lg:translate-x-0'}
                `}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{t('Filters')}</h2>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setFilters({});
                                    setStartDate('');
                                    setEndDate('');
                                    setMinAmount('');
                                    setMaxAmount('');
                                }}
                                className="text-xs text-emerald-400 font-medium hover:text-emerald-300 hover:underline transition-colors"
                            >
                                {t('Reset All')}
                            </button>
                            <button
                                onClick={() => setIsFiltersOpen(false)}
                                className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Add Transaction Button */}
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110 text-white dark:text-slate-900 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        {t('Add Transaction')}
                    </button>

                    {/* Date Range Filter */}
                    <div className="flex flex-col gap-3">
                        <p className="text-slate-500 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">{t('Date Range')}</p>
                        <div className="flex flex-col gap-2">
                            <div>
                                <label htmlFor="filter-start-date" className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t('Start Date')}</label>
                                <input
                                    id="filter-start-date"
                                    name="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none"
                                />
                            </div>
                            <div>
                                <label htmlFor="filter-end-date" className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t('End Date')}</label>
                                <input
                                    id="filter-end-date"
                                    name="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Amount Range Filter */}
                    <div className="flex flex-col gap-3">
                        <p className="text-slate-500 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">{t('Amount Range')}</p>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label htmlFor="filter-min-amount" className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t('Min')}</label>
                                <input
                                    id="filter-min-amount"
                                    name="minAmount"
                                    type="number"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none placeholder-slate-400 dark:placeholder-slate-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="filter-max-amount" className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{t('Max')}</label>
                                <input
                                    id="filter-max-amount"
                                    name="maxAmount"
                                    type="number"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                    placeholder="∞"
                                    className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none placeholder-slate-400 dark:placeholder-slate-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Categories Filter */}
                    <div className="flex flex-col gap-3">
                        <p className="text-slate-500 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">{t('Categories')}</p>
                        <div className="flex flex-col gap-2">
                            {categoriesLoading ? (
                                Array(4).fill(0).map((_, idx) => (
                                    <Skeleton key={idx} className="h-8 w-full rounded-lg" />
                                ))
                            ) : categories && categories.length > 0 ? (
                                categories.slice(0, 6).map((category) => (
                                    <label key={category.id} htmlFor={`filter-category-${category.id}`} className="flex items-center gap-3 cursor-pointer group p-1.5 -mx-1.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                                        <input
                                            id={`filter-category-${category.id}`}
                                            name="categoryId"
                                            className="form-checkbox rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 focus:ring-slate-400/40 focus:ring-offset-0 size-4 transition-all checked:border-slate-400"
                                            type="checkbox"
                                            checked={filters.categoryId === category.id}
                                            onChange={() => setFilters(prev => ({ ...prev, categoryId: prev.categoryId === category.id ? undefined : category.id }))}
                                        />
                                        <span className={`flex-1 text-sm transition-colors ${filters.categoryId === category.id ? 'text-slate-900 dark:text-slate-400 font-medium' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-300'}`}>{category.name}</span>
                                    </label>
                                ))
                            ) : (
                                <p className="text-slate-500 dark:text-slate-400 text-sm">{t('No categories')}</p>
                            )}
                        </div>
                    </div>

                    {/* Accounts Filter */}
                    <div className="flex flex-col gap-3">
                        <p className="text-slate-500 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">{t('Accounts')}</p>
                        <div className="flex flex-col gap-2">
                            {accountsLoading ? (
                                Array(3).fill(0).map((_, idx) => (
                                    <Skeleton key={idx} className="h-8 w-full rounded-lg" />
                                ))
                            ) : accounts && accounts.length > 0 ? (
                                accounts.map((account) => (
                                    <label key={account.id} htmlFor={`filter-account-${account.id}`} className="flex items-center gap-3 cursor-pointer group p-1.5 -mx-1.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                                        <input
                                            id={`filter-account-${account.id}`}
                                            name="accountId"
                                            className="form-checkbox rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-emerald-500/30 text-emerald-500 focus:ring-emerald-500/40 focus:ring-offset-0 size-4 transition-all checked:border-emerald-500"
                                            type="checkbox"
                                            checked={filters.accountId === account.id}
                                            onChange={() => setFilters(prev => ({ ...prev, accountId: prev.accountId === account.id ? undefined : account.id }))}
                                        />
                                        <span className="flex-1 text-sm text-slate-600 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-400 transition-colors">{account.name}</span>
                                    </label>
                                ))
                            ) : (
                                <p className="text-slate-500 dark:text-slate-400 text-sm">{t('No accounts')}</p>
                            )}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Add Transaction Modal */}
            <AddTransactionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />

            {/* Edit Transaction Modal */}
            <EditTransactionModal
                isOpen={!!editingTransaction}
                onClose={() => setEditingTransaction(null)}
                transaction={editingTransaction}
            />
        </div>
    );
}
