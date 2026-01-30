import React, { useState } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import { useUpdateSavingsGoal } from '../hooks/useSavings';

export default function AddContributionModal({ isOpen, onClose, goal }) {
    const { t } = usePreferences();
    const updateGoal = useUpdateSavingsGoal();
    const [amount, setAmount] = useState('');

    if (!isOpen || !goal) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const current = parseFloat(goal.currentAmount) || 0;
            const contribution = parseFloat(amount);

            if (isNaN(contribution) || contribution <= 0) return;

            await updateGoal.mutateAsync({
                id: goal.id,
                data: { currentAmount: current + contribution }
            });
            onClose();
            setAmount('');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('Add Contribution')}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="contribution-amount" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('Amount')}</label>
                        <input
                            id="contribution-amount"
                            type="number"
                            required
                            min="0.01"
                            step="0.01"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-start outline-none transition-all"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={updateGoal.isPending}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold hover:brightness-110 active:scale-95 transition-all mt-4 disabled:opacity-50"
                    >
                        {updateGoal.isPending ? t('Saving...') : t('Add Contribution')}
                    </button>
                </form>
            </div>
        </div>
    );
}
