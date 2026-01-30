import React, { useState } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import { useCategories } from '../hooks/useCategories';
import { useAccounts } from '../hooks/useAccounts';
import { useCreateTransaction } from '../hooks/useTransactions';
import Modal from './Modal';

export default function AddTransactionModal({ isOpen, onClose }) {
    const { formatCurrency, t, getCurrencySymbol, formatNumberWithSeparator } = usePreferences();
    const { data: categories } = useCategories();
    const { data: accounts } = useAccounts();
    const createTransaction = useCreateTransaction();

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        type: 'expense',
        categoryId: '',
        accountId: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'amount') {
            // Remove non-numeric characters except dot (for decimals if needed, but per request 1000 -> 1.000 usually implies integer or standard locale)
            // But let's handle it carefully. The user wants 1000 -> 1.000 (thousand separator).
            // We'll store the raw number in state but formatted in UI? Or handle it on blur?
            // "dibuat automatis 1.000" implies input masking. 
            // Let's strip non-digits to get raw value, then format.
            const rawValue = value.replace(/[^\d]/g, '');
            if (rawValue === '') {
                setFormData(prev => ({ ...prev, [name]: '' }));
                return;
            }
            const numValue = parseInt(rawValue, 10);
            const formatted = new Intl.NumberFormat(getCurrencySymbol() === 'Rp' ? 'id-ID' : 'en-US').format(numValue);

            // For the input value we want the formatted string, but for submission we need the number. 
            // The state `formData.amount` is currently used for both. 
            // If we change it to store string, we need to parse it back on submit.
            // Let's store the formatted string in state for the input, and clean it on submit.
            setFormData(prev => ({ ...prev, [name]: formatted }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        const rawAmount = formData.amount.toString().replace(/[^\d]/g, '');
        if (!formData.amount || parseFloat(rawAmount) <= 0) newErrors.amount = 'Valid amount is required';
        if (!formData.categoryId) newErrors.categoryId = 'Category is required';
        if (!formData.accountId) newErrors.accountId = 'Account is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await createTransaction.mutateAsync({
                description: formData.description,
                amount: parseFloat(formData.amount.toString().replace(/[^\d]/g, '')),
                type: formData.type,
                categoryId: formData.categoryId,
                accountId: formData.accountId,
                date: new Date(formData.date).toISOString(),
                notes: formData.notes
            });
            // Reset form and close
            setFormData({
                description: '',
                amount: '',
                type: 'expense',
                categoryId: '',
                accountId: '',
                date: new Date().toISOString().split('T')[0],
                notes: ''
            });
            onClose();
        } catch (error) {
            console.error('Failed to create transaction:', error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('Add Transaction')} size="md">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Type Toggle */}
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-white/5">
                    <button
                        type="button"
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${formData.type === 'expense'
                            ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
                    >
                        <span className="material-symbols-outlined text-[18px] mr-1 align-middle">arrow_downward</span>
                        {t('Expense')}
                    </button>
                    <button
                        type="button"
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${formData.type === 'income'
                            ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
                    >
                        <span className="material-symbols-outlined text-[18px] mr-1 align-middle">arrow_upward</span>
                        {t('Income')}
                    </button>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <label htmlFor="transaction-description" className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('Description')}</label>
                    <input
                        type="text"
                        id="transaction-description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="e.g., Grocery shopping, Salary..."
                        className={`w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border py-2.5 px-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all ${errors.description ? 'border-rose-500' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500/50'
                            }`}
                    />
                    {errors.description && <p className="text-rose-400 text-xs ml-1">{errors.description}</p>}
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                    <label htmlFor="transaction-amount" className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('Amount')}</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 text-sm font-bold">{getCurrencySymbol()}</span>
                        <input
                            type="text"
                            id="transaction-amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0"
                            className={`w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all ${errors.amount ? 'border-rose-500' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500/50'
                                }`}
                        />
                    </div>
                    {errors.amount && <p className="text-rose-500 dark:text-rose-400 text-xs ml-1">{errors.amount}</p>}
                </div>

                {/* Category & Account */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label htmlFor="transaction-category" className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('Category')}</label>
                        <select
                            id="transaction-category"
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={handleChange}
                            className={`w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all cursor-pointer ${errors.categoryId ? 'border-rose-500' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500/50'
                                }`}
                        >
                            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{t('Select')}...</option>
                            {categories?.map(cat => (
                                <option key={cat.id} value={cat.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{cat.name}</option>
                            ))}
                        </select>
                        {errors.categoryId && <p className="text-rose-500 dark:text-rose-400 text-xs ml-1">{errors.categoryId}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="transaction-account" className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('Account')}</label>
                        <select
                            id="transaction-account"
                            name="accountId"
                            value={formData.accountId}
                            onChange={handleChange}
                            className={`w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all cursor-pointer ${errors.accountId ? 'border-rose-500' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500/50'
                                }`}
                        >
                            <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{t('Select')}...</option>
                            {accounts?.map(acc => (
                                <option key={acc.id} value={acc.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{acc.name}</option>
                            ))}
                        </select>
                        {errors.accountId && <p className="text-rose-500 dark:text-rose-400 text-xs ml-1">{errors.accountId}</p>}
                    </div>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                    <label htmlFor="transaction-date" className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('Date')}</label>
                    <input
                        type="date"
                        id="transaction-date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none transition-all"
                    />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                    <label htmlFor="transaction-notes" className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('Notes')} ({t('optional')})</label>
                    <textarea
                        id="transaction-notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Add any additional notes..."
                        rows={2}
                        className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 py-2.5 px-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none transition-all resize-none"
                    />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                        {t('Cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={createTransaction.isPending}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white dark:text-slate-900 text-sm font-bold hover:brightness-110 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {createTransaction.isPending ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                {t('Saving...')}
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                {t('Add Transaction')}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
