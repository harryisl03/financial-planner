import React, { useState, useMemo } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import { useCategories } from '../hooks/useCategories';
import { useBudgets, useUpdateBudget, useCreateBudget, useDeleteBudget } from '../hooks/useBudgets';
import Modal from './Modal';

export default function EditBudgetModal({ isOpen, onClose }) {
    const { t, formatCurrency } = usePreferences();
    const { data: categories } = useCategories();
    const { data: budgets } = useBudgets();

    const updateBudgetMutation = useUpdateBudget();
    const createBudgetMutation = useCreateBudget();
    const deleteBudgetMutation = useDeleteBudget();

    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editAmount, setEditAmount] = useState('');

    // Merge categories with their budgets - filter unique and expense only
    const budgetList = useMemo(() => {
        if (!categories) return [];
        // Filter expense categories only and remove duplicates by name
        const uniqueCategories = [];
        const seenNames = new Set();
        for (const cat of categories) {
            if (cat.type === 'expense' && !seenNames.has(cat.name.toLowerCase())) {
                seenNames.add(cat.name.toLowerCase());
                const budget = budgets?.find(b => b.categoryId === cat.id);
                uniqueCategories.push({
                    ...cat,
                    budget // might be undefined if no budget exists
                });
            }
        }
        return uniqueCategories;
    }, [categories, budgets]);

    const handleEdit = (item) => {
        setEditingCategoryId(item.id);
        setEditAmount(item.budget?.limit || item.budget?.amount || '');
    };

    const handleSave = async (item) => {
        if (!editAmount || isNaN(editAmount)) return;

        try {
            if (item.budget) {
                // Update existing
                await updateBudgetMutation.mutateAsync({
                    id: item.budget.id,
                    data: { amount: parseFloat(editAmount) }
                });
            } else {
                // Create new
                await createBudgetMutation.mutateAsync({
                    categoryId: item.id,
                    amount: parseFloat(editAmount),
                    periodType: 'monthly',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
                });
            }
            setEditingCategoryId(null);
        } catch (error) {
            console.error('Failed to save budget:', error);
            // In a real app, use a toast notification
            alert(t('Failed to save budget. Please try again.'));
        }
    };

    const handleDelete = async (budgetId) => {
        if (confirm(t('Are you sure you want to remove this budget limit?'))) {
            try {
                await deleteBudgetMutation.mutateAsync(budgetId);
            } catch (error) {
                console.error('Failed to delete budget:', error);
            }
        }
    };

    const handleCancel = () => {
        setEditingCategoryId(null);
        setEditAmount('');
    };

    const isLoading = updateBudgetMutation.isPending || createBudgetMutation.isPending || deleteBudgetMutation.isPending;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('Manage Monthly Budgets')} size="lg">
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{t('Set monthly spending limits for your categories.')}</p>
                {(!budgetList || budgetList.length === 0) ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <p>{t('No categories found.')}</p>
                    </div>
                ) : (
                    budgetList.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 group hover:border-emerald-500/30 dark:hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-500 dark:text-emerald-400 border border-slate-200 dark:border-white/5">
                                    <span className="material-symbols-outlined">category</span>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-50">{item.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {item.budget ? `Spent: ${formatCurrency(item.budget.spent || 0)}` : 'No limit set'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {editingCategoryId === item.id ? (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                                        <input
                                            id={`edit-budget-${item.id}`}
                                            name="budgetLimit"
                                            type="number"
                                            value={editAmount}
                                            onChange={(e) => setEditAmount(e.target.value)}
                                            className="w-24 rounded-lg bg-white dark:bg-slate-800 border border-emerald-500/50 px-2 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                                            placeholder="Limit"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleSave(item)}
                                            disabled={isLoading}
                                            className="p-1.5 rounded-lg bg-emerald-500 text-white dark:text-slate-900 hover:bg-emerald-400 transition-colors shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">check</span>
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        {item.budget ? (
                                            <span className="font-mono font-bold text-lg text-slate-700 dark:text-slate-300">
                                                {formatCurrency(item.budget.limit || item.budget.amount || 0)}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                                                {t('Not Set')}
                                            </span>
                                        )}

                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                                title={item.budget ? t("Edit Limit") : t("Set Limit")}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            {item.budget && (
                                                <button
                                                    onClick={() => handleDelete(item.budget.id)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                    title={t("Remove Limit")}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={onClose}
                    className="px-6 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 border border-slate-300 dark:border-white/5 transition-colors"
                >
                    {t('Done')}
                </button>
            </div>
        </Modal>
    );
}
