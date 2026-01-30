import React, { useState, useMemo } from 'react';
import { useSidebar } from '../context/SidebarContext';
import { usePreferences } from '../context/PreferencesContext';
import { useBudgets, useBudgetOverview } from '../hooks/useBudgets';
import { useSavings, useUpdateSavingsGoal, useDeleteSavingsGoal } from '../hooks/useSavings';
import { useAlerts } from '../hooks/useAlerts';
import AddTransactionModal from './AddTransactionModal';
import EditBudgetModal from './EditBudgetModal';
import SavingsGoal from './SavingsGoal';
import SmartAlerts from './SmartAlerts';
import BillsSection from './BillsSection';
import AddSavingsGoalModal from './AddSavingsGoalModal';
import AddContributionModal from './AddContributionModal';

export default function Budget() {
    const { toggleSidebar } = useSidebar();
    const { t, formatCurrency } = usePreferences();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
    const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState(null);

    // Fetch data from API
    const { data: budgets, isLoading: budgetsLoading } = useBudgets();
    const { data: overview, isLoading: overviewLoading } = useBudgetOverview();
    const { data: savingsGoals, isLoading: savingsLoading } = useSavings();
    const { data: alerts, isLoading: alertsLoading } = useAlerts();

    const updateSavingsMutation = useUpdateSavingsGoal();
    const deleteSavingsMutation = useDeleteSavingsGoal();

    // Filter unique budgets by category name to prevent duplicates
    const uniqueBudgets = useMemo(() => {
        if (!Array.isArray(budgets)) return [];
        const seen = new Set();
        return budgets.filter(budget => {
            const categoryName = (budget.category?.name || budget.name || 'Unknown').toLowerCase();
            if (seen.has(categoryName)) return false;
            seen.add(categoryName);
            return true;
        });
    }, [budgets]);

    // Skeleton component
    const Skeleton = ({ className }) => (
        <div className={`animate-pulse bg-slate-700/50 rounded ${className}`}></div>
    );

    // Calculate totals from overview or budgets
    // Prefer overview data if available, fallback to calculating from budgets list
    const totalSpent = (overview && typeof overview.totalSpent === 'number')
        ? overview.totalSpent
        : ((Array.isArray(budgets) ? budgets : [])?.reduce((sum, b) => sum + parseFloat(b.spent || 0), 0) || 0);

    const totalLimit = (overview && typeof overview.totalBudget === 'number')
        ? overview.totalBudget
        : ((Array.isArray(budgets) ? budgets : [])?.reduce((sum, b) => sum + parseFloat(b.limit || b.amount || 0), 0) || 0);

    const remaining = totalLimit - totalSpent;
    const percentUsed = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

    // Derived values for summary cards
    // Calculate daily average based on total spent / current day of month
    const currentDay = new Date().getDate() || 1;
    const dailyAvg = totalSpent > 0 ? totalSpent / currentDay : 0;

    // Calculate total saved from all savings goals
    const savedAmount = (savingsGoals || []).reduce((sum, goal) => sum + parseFloat(goal.currentAmount || 0), 0);


    // Icon mapping for categories
    const getCategoryIcon = (category) => {
        const icons = {
            'transport': 'directions_car', 'transportation': 'directions_car',
            'food': 'restaurant', 'food & dining': 'restaurant', 'dining': 'restaurant',
            'coffee': 'coffee', 'cafe': 'coffee',
            'shopping': 'shopping_bag',
            'entertainment': 'movie', 'theater_comedy': 'theater_comedy',
            'rent': 'home', 'bills': 'home', 'rent & bills': 'home', 'housing': 'home',
            'utilities': 'bolt',
            'health': 'fitness_center',
            'education': 'school'
        };
        return icons[category?.toLowerCase()] || 'category';
    };

    // Get status info for a budget
    const getBudgetStatus = (spent, limit) => {
        const percent = limit > 0 ? (spent / limit) * 100 : 0;
        if (percent > 100) return { label: t('Over Budget'), color: 'text-rose-400 bg-rose-500/10' };
        if (percent >= 80) return { label: t('Near Limit'), color: 'text-amber-400 bg-amber-500/10' };
        return { label: t('On Track'), color: 'text-emerald-400 bg-emerald-500/10' };
    };

    const handleAddContribution = () => {
        setIsContributionModalOpen(true);
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-900 relative transition-all duration-300">
            <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 custom-scrollbar">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{t('Budget Management')}</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('Plan and track your monthly spending')}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex h-10 items-center justify-center gap-2 px-4 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all md:bg-white md:dark:bg-slate-800 md:text-slate-500 md:dark:text-slate-400 md:border md:border-slate-200 md:dark:border-white/10 md:shadow-none md:hover:border-slate-300 md:dark:hover:border-white/20 md:hover:text-slate-900 md:dark:hover:text-white"
                            >
                                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                <span>{t('Add Transaction')}</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* Main Content Area (8 cols) */}
                        <div className="xl:col-span-8 flex flex-col gap-6">

                            {/* Total Budget Overview Card */}
                            <div className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-8 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5">
                                <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">{t('Total Budget Spent')}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${remaining >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                                {remaining >= 0 ? t('On Track') : t('Over Budget')}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-6">
                                            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                                {overviewLoading ? '...' : formatCurrency(totalSpent)}
                                            </h2>
                                            <span className="text-slate-400 dark:text-slate-500 font-medium">/ {overviewLoading ? '...' : formatCurrency(totalLimit)}</span>
                                        </div>
                                        <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-8">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${percentUsed > 100 ? 'bg-gradient-to-r from-rose-500 to-orange-500' : 'bg-gradient-to-r from-primary-start to-primary-end'}`}
                                                style={{ width: `${Math.min(percentUsed, 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                            <div>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">{t('Remaining')}</p>
                                                <p className={`text-xl font-bold ${remaining < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                                                    {overviewLoading ? '...' : formatCurrency(remaining)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">{t('Daily Avg')}</p>
                                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                                    {overviewLoading ? '...' : formatCurrency(dailyAvg)}
                                                </p>
                                            </div>
                                            <div className="hidden sm:block">
                                                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">{t('Saved')}</p>
                                                <p className="text-xl font-bold text-emerald-500">
                                                    {savingsLoading ? '...' : `+${formatCurrency(savedAmount)}`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Categories Section - Dark Theme to match BillsSection */}
                            <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }} className="rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-white/5 text-white">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-white">{t('Categories Breakdown')}</h3>
                                    <button
                                        onClick={() => setIsEditModalOpen(true)}
                                        className="flex items-center gap-2 text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                        <span>{t('Edit Budget')}</span>
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {budgetsLoading ? (
                                        <div className="space-y-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse"></div>
                                            ))}
                                        </div>
                                    ) : uniqueBudgets.length > 0 ? (
                                        uniqueBudgets.map((budget) => {
                                            const spent = parseFloat(budget.spent || 0);
                                            const limit = parseFloat(budget.limit || budget.amount || 0);
                                            const status = getBudgetStatus(spent, limit);
                                            const categoryName = budget.category?.name || budget.name || 'Unknown';
                                            const icon = getCategoryIcon(categoryName);

                                            return (
                                                <div key={budget.id} className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 hover:border-emerald-500/30 transition-all group">
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <div className="size-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                                                            <span className="material-symbols-outlined">{icon}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-0.5">
                                                                <span className="text-sm font-bold text-white">{categoryName}</span>
                                                                <span className="text-xs font-bold text-slate-400">
                                                                    {formatCurrency(spent)} <span className="text-slate-600 font-normal">/ {formatCurrency(limit)}</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-1000 ease-out"
                                                            style={{ width: `${Math.min((spent / limit) * 100, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-8 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                                            <p className="text-slate-400 text-sm mb-2">{t('No categories yet.')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bills Section */}
                            <BillsSection />
                        </div>

                        {/* Sidebar Widgets (4 cols) */}
                        <div className="xl:col-span-4 flex flex-col gap-6">
                            {/* Financial Goals Widget */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('Financial Goals')}</h3>
                                    <button
                                        onClick={() => {
                                            setEditingGoal(null);
                                            setIsAddGoalModalOpen(true);
                                        }}
                                        className="text-emerald-500 hover:text-emerald-400 font-bold text-sm flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                        {t('Add New')}
                                    </button>
                                </div>

                                {savingsLoading ? (
                                    <div className="glass-card rounded-3xl p-6 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 h-80 animate-pulse"></div>
                                ) : (savingsGoals && savingsGoals.length > 0) ? (
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                                        {savingsGoals.map(goal => (
                                            <SavingsGoal
                                                key={goal.id}
                                                goal={goal}
                                                onAddContribution={() => {
                                                    setSelectedGoal(goal);
                                                    setIsContributionModalOpen(true);
                                                }}
                                                onEdit={(g) => {
                                                    setEditingGoal(g);
                                                    setIsAddGoalModalOpen(true);
                                                }}
                                                onDelete={(id) => deleteSavingsMutation.mutate(id)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="glass-card rounded-3xl p-8 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 text-center">
                                        <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500 mx-auto">
                                            <span className="material-symbols-outlined text-3xl">savings</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('No Financial Goals')}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('Set a target to start saving.')}</p>
                                        <button
                                            onClick={() => {
                                                setEditingGoal(null);
                                                setIsAddGoalModalOpen(true);
                                            }}
                                            className="px-6 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:brightness-110 shadow-lg active:scale-95 transition-all"
                                        >
                                            {t('Create Goal')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Smart Alerts Widget */}
                            {alertsLoading ? (
                                <div className="glass-card rounded-3xl p-6 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 h-64 animate-pulse"></div>
                            ) : (
                                <SmartAlerts alerts={alerts} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Transaction Modal */}
            <AddTransactionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />

            {/* Edit Budget Modal */}
            <EditBudgetModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                budgets={budgets}
            />

            {/* Add Savings Goal Modal */}
            <AddSavingsGoalModal
                isOpen={isAddGoalModalOpen}
                onClose={() => {
                    setIsAddGoalModalOpen(false);
                    setEditingGoal(null);
                }}
                goalToEdit={editingGoal}
            />

            {/* Add Contribution Modal */}
            <AddContributionModal
                isOpen={isContributionModalOpen}
                onClose={() => setIsContributionModalOpen(false)}
                goal={selectedGoal}
            />
        </div >
    );
}
