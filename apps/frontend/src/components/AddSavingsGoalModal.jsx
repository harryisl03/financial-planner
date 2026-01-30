import React, { useState, useEffect } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import { useCreateSavingsGoal, useUpdateSavingsGoal } from '../hooks/useSavings';

export default function AddSavingsGoalModal({ isOpen, onClose, goalToEdit }) {
    const { t } = usePreferences();
    const createGoal = useCreateSavingsGoal();
    const updateGoal = useUpdateSavingsGoal();

    const [formData, setFormData] = useState({
        name: '',
        targetAmount: '',
        color: 'emerald', // default
    });

    useEffect(() => {
        if (isOpen) {
            if (goalToEdit) {
                setFormData({
                    name: goalToEdit.name,
                    targetAmount: goalToEdit.targetAmount,
                    color: goalToEdit.color || 'emerald',
                });
            } else {
                setFormData({ name: '', targetAmount: '', color: 'emerald' });
            }
        }
    }, [isOpen, goalToEdit]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (goalToEdit) {
                await updateGoal.mutateAsync({
                    id: goalToEdit.id,
                    data: formData
                });
            } else {
                await createGoal.mutateAsync({
                    ...formData,
                    currentAmount: 0
                });
            }
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    const colors = [
        { id: 'emerald', bg: 'bg-emerald-500' },
        { id: 'blue', bg: 'bg-blue-500' },
        { id: 'rose', bg: 'bg-rose-500' },
        { id: 'amber', bg: 'bg-amber-500' },
    ];

    const isPending = createGoal.isPending || updateGoal.isPending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{goalToEdit ? t('Edit Savings Goal') : t('New Savings Goal')}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="goal-name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('Goal Name')}</label>
                        <input
                            id="goal-name"
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-start outline-none transition-all"
                            placeholder="e.g. New Car, Vacation"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label htmlFor="goal-target" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('Target Amount')}</label>
                        <input
                            id="goal-target"
                            type="number"
                            required
                            min="1"
                            step="0.01"
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-start outline-none transition-all"
                            placeholder="0.00"
                            value={formData.targetAmount}
                            onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                        />
                    </div>

                    <div>
                        <span className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('Color')}</span>
                        <div className="flex gap-3" role="radiogroup" aria-label={t('Color')}>
                            {colors.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color: c.id })}
                                    className={`size-10 rounded-full ${c.bg} transition-all ${formData.color === c.id ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                                    aria-label={c.id}
                                    aria-checked={formData.color === c.id}
                                    role="radio"
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold hover:brightness-110 active:scale-95 transition-all mt-4 disabled:opacity-50"
                    >
                        {isPending ? t('Saving...') : (goalToEdit ? t('Save Changes') : t('Create Goal'))}
                    </button>
                </form>
            </div>
        </div>
    );
}
