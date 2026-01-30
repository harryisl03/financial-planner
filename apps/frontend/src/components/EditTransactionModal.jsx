import React, { useState, useEffect } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useAccounts } from '../hooks/useAccounts';
import { useUpdateTransaction, useDeleteTransaction } from '../hooks/useTransactions';
import { usePreferences } from '../context/PreferencesContext';
import Modal from './Modal';

export default function EditTransactionModal({ isOpen, onClose, transaction }) {
    const { t, getCurrencySymbol } = usePreferences();
    const { data: categories } = useCategories();
    const { data: accounts } = useAccounts();
    const updateTransactionMutation = useUpdateTransaction();
    const deleteTransactionMutation = useDeleteTransaction();

    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (transaction) {
            setType(transaction.type);
            setAmount(transaction.amount);
            setCategoryId(transaction.categoryId || '');
            setAccountId(transaction.accountId || '');
            setDescription(transaction.description || '');
            setDate(transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '');
            setNotes(transaction.notes || '');
        }
    }, [transaction, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateTransactionMutation.mutateAsync({
                id: transaction.id,
                data: {
                    type,
                    amount: parseFloat(amount),
                    categoryId,
                    accountId,
                    description,
                    date: new Date(date).toISOString(),
                    notes
                }
            });
            onClose();
        } catch (error) {
            console.error('Failed to update transaction:', error);
        }
    };

    const handleDelete = async () => {
        if (confirm(t('Are you sure you want to delete this transaction?'))) {
            try {
                await deleteTransactionMutation.mutateAsync(transaction.id);
                onClose();
            } catch (error) {
                console.error('Failed to delete transaction:', error);
                // If it's 404, it's already gone, so just close
                if (error.message && error.message.includes('404')) {
                    onClose();
                } else {
                    alert(t('Failed to delete transaction. Please try again.'));
                }
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('Edit Transaction')}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Type Selection */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setType('expense')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'expense'
                            ? 'bg-rose-500 text-white shadow-lg'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        {t('Expense')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('income')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'income'
                            ? 'bg-emerald-500 text-white dark:text-slate-900 shadow-lg'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        {t('Income')}
                    </button>
                </div>

                {/* Amount */}
                <div>
                    <label htmlFor="edit-amount" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t('Amount')}</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 font-bold">{getCurrencySymbol()}</span>
                        <input
                            id="edit-amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-8 pr-4 text-slate-900 dark:text-white font-bold focus:border-emerald-500 focus:outline-none transition-colors"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="edit-description" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t('Description')}</label>
                    <input
                        id="edit-description"
                        name="description"
                        type="text"
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors"
                        placeholder={t('What is this for?')}
                    />
                </div>

                {/* Category & Account */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="edit-category" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t('Category')}</label>
                        <select
                            id="edit-category"
                            name="categoryId"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors appearance-none"
                            required
                        >
                            <option value="" disabled>{t('Select')}</option>
                            {categories?.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="edit-account" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t('Account')}</label>
                        <select
                            id="edit-account"
                            name="accountId"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors appearance-none"
                            required
                        >
                            <option value="" disabled>{t('Select')}</option>
                            {accounts?.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Date */}
                <div>
                    <label htmlFor="edit-date" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t('Date')}</label>
                    <input
                        id="edit-date"
                        name="date"
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors"
                    />
                </div>

                {/* Notes */}
                <div>
                    <label htmlFor="edit-notes" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">{t('Notes')}</label>
                    <textarea
                        id="edit-notes"
                        name="notes"
                        rows="2"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors resize-none"
                        placeholder={t('Optional notes...')}
                    ></textarea>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-2">
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteTransactionMutation.isPending}
                        className="flex-1 py-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold hover:bg-rose-500/20 transition-all"
                    >
                        {deleteTransactionMutation.isPending ? t('Deleting...') : t('Delete')}
                    </button>
                    <button
                        type="submit"
                        disabled={updateTransactionMutation.isPending}
                        className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white dark:text-slate-900 font-bold shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {updateTransactionMutation.isPending ? t('Saving...') : t('Save Changes')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
