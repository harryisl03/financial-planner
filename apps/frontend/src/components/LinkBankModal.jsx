import React, { useState } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import { useCreateAccount } from '../hooks/useAccounts';
import Modal from './Modal';

export default function LinkBankModal({ isOpen, onClose }) {
    const { t } = usePreferences();
    const createAccount = useCreateAccount();

    const [formData, setFormData] = useState({
        name: '',
        type: 'bank',
        balance: '',
        institution: ''
    });

    const [errors, setErrors] = useState({});

    const bankOptions = [
        { id: 'bank', name: 'Bank Account', icon: 'account_balance', color: 'emerald' },
        { id: 'wallet', name: 'Digital Wallet', icon: 'account_balance_wallet', color: 'blue' },
        { id: 'cash', name: 'Cash', icon: 'payments', color: 'green' },
        { id: 'credit', name: 'Credit Card', icon: 'credit_card', color: 'purple' },
        { id: 'investment', name: 'Investment', icon: 'trending_up', color: 'orange' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Account name is required';
        if (formData.balance && isNaN(parseFloat(formData.balance))) newErrors.balance = 'Invalid balance';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await createAccount.mutateAsync({
                name: formData.name,
                type: formData.type,
                balance: parseFloat(formData.balance) || 0,
                institution: formData.institution || null
            });
            // Reset form and close
            setFormData({
                name: '',
                type: 'bank',
                balance: '',
                institution: ''
            });
            onClose();
        } catch (error) {
            console.error('Failed to link account:', error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('Link New Account')} size="md">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Account Type Selection */}
                <div className="space-y-2">
                    <label id="link-account-type-label" className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('Account Type')}</label>
                    <div className="grid grid-cols-2 gap-3">
                        {bankOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => handleChange({ target: { name: 'type', value: option.id } })}
                                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${formData.type === option.id
                                    ? `bg-${option.color}-500/10 border-${option.color}-500/30 text-${option.color}-500 dark:text-${option.color}-400`
                                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/10 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-2xl">{option.icon}</span>
                                <span className="text-sm font-medium">{option.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Account Name */}
                <div className="space-y-1.5">
                    <label htmlFor="link-account-name" className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('Account Name')}</label>
                    <input
                        id="link-account-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., Main Savings, Company Credit..."
                        className={`w-full rounded-xl bg-white dark:bg-slate-900/50 border py-2.5 px-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all ${errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500/50'
                            }`}
                    />
                    {errors.name && <p className="text-rose-500 dark:text-rose-400 text-xs ml-1">{errors.name}</p>}
                </div>

                {/* Institution - Hide for Cash */}
                {formData.type !== 'cash' && (
                    <div className="space-y-1.5">
                        <label htmlFor="link-institution" className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('Institution')} ({t('optional')})</label>
                        <input
                            id="link-institution"
                            type="text"
                            name="institution"
                            value={formData.institution}
                            onChange={handleChange}
                            placeholder="e.g., Bank of America, Chase..."
                            className="w-full rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 py-2.5 px-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500/50 outline-none transition-all"
                        />
                    </div>
                )}

                {/* Initial Balance */}
                <div className="space-y-1.5">
                    <label htmlFor="link-balance" className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('Initial Balance')}</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 text-sm">$</span>
                        <input
                            id="link-balance"
                            type="number"
                            name="balance"
                            value={formData.balance}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            className={`w-full rounded-xl bg-white dark:bg-slate-900/50 border py-2.5 pl-8 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all ${errors.balance ? 'border-rose-500' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500/50'
                                }`}
                        />
                    </div>
                    {errors.balance && <p className="text-rose-500 dark:text-rose-400 text-xs ml-1">{errors.balance}</p>}
                </div>

                {/* Info box */}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-500 dark:text-blue-400 mt-0.5">info</span>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                        Your account will be added manually. Automatic bank sync requires Premium subscription.
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={createAccount.isPending}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-primary text-white dark:text-slate-900 text-sm font-bold hover:brightness-110 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {createAccount.isPending ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                Linking...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">add_link</span>
                                Link Account
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
