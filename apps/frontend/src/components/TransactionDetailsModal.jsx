import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { usePreferences } from '../context/PreferencesContext';
import { format } from 'date-fns';

export default function TransactionDetailsModal({ isOpen, onClose, transaction }) {
    const { formatCurrency, t } = usePreferences();

    if (!transaction) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-bold leading-6 text-slate-900 dark:text-slate-50 flex justify-between items-center"
                                >
                                    {t('Transaction Details')}
                                    <button
                                        onClick={onClose}
                                        className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </Dialog.Title>

                                <div className="mt-6 space-y-6">
                                    <div className="flex flex-col items-center justify-center py-4 border-b border-slate-100 dark:border-white/5">
                                        <div className={`p-4 rounded-full mb-3 ${transaction.type === 'income'
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : 'bg-rose-500/10 text-rose-500'
                                            }`}>
                                            <span className="material-symbols-outlined text-3xl">
                                                {transaction.category?.icon || (transaction.type === 'income' ? 'trending_up' : 'trending_down')}
                                            </span>
                                        </div>
                                        <h2 className={`text-3xl font-bold ${transaction.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-slate-50'
                                            }`}>
                                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 uppercase tracking-wide font-medium">
                                            {t(transaction.type)}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                                            <span className="text-slate-500 dark:text-slate-400 text-sm">{t('Description')}</span>
                                            <span className="text-slate-900 dark:text-slate-50 font-medium">{transaction.description || '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                                            <span className="text-slate-500 dark:text-slate-400 text-sm">{t('Category')}</span>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: transaction.category?.color || '#94a3b8' }}
                                                />
                                                <span className="text-slate-900 dark:text-slate-50 font-medium">
                                                    {transaction.category?.name || t('Uncategorized')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                                            <span className="text-slate-500 dark:text-slate-400 text-sm">{t('Date')}</span>
                                            <span className="text-slate-900 dark:text-slate-50 font-medium">
                                                {format(new Date(transaction.date), 'MMMM d, yyyy')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
                                            <span className="text-slate-500 dark:text-slate-400 text-sm">{t('Account')}</span>
                                            <span className="text-slate-900 dark:text-slate-50 font-medium">
                                                {transaction.account?.name || t('Main Account')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <button
                                        type="button"
                                        className="w-full inline-flex justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-colors"
                                        onClick={onClose}
                                    >
                                        {t('Close')}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
