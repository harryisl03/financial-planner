import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePreferences } from '../context/PreferencesContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billsApi } from '../services/billsApi';
import Modal from './Modal';
import { useForm } from 'react-hook-form';

export default function BillsSection({ variant = 'default' }) {
    const { t, formatCurrency } = usePreferences();
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);

    // Fetch Bills
    const { data: bills, isLoading, isError } = useQuery({
        queryKey: ['bills'],
        queryFn: async () => {
            const res = await billsApi.getAll();
            return res;
        }
    });

    // Create Bill Mutation
    const createMutation = useMutation({
        mutationFn: async (data) => {
            await billsApi.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['bills']);
            setIsAddModalOpen(false);
        }
    });

    // Update Bill Mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, ...data }) => {
            await billsApi.update(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['bills']);
            setIsAddModalOpen(false);
            setSelectedBill(null);
            reset();
        }
    });

    // Delete Bill Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await billsApi.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['bills']);
            setIsDeleteModalOpen(false);
            setSelectedBill(null);
        }
    });

    // Form
    const { register, handleSubmit, reset, setValue } = useForm();

    // Reset form when modal opens
    useEffect(() => {
        if (isAddModalOpen) reset();
    }, [isAddModalOpen, reset]);

    const onSubmit = (data) => {
        const payload = {
            ...data,
            amount: parseFloat(data.amount),
            dueDate: parseInt(data.dueDate),
            isAutoPaid: false
        };

        if (selectedBill) {
            updateMutation.mutate({ id: selectedBill.id, ...payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleDelete = () => {
        if (selectedBill) {
            deleteMutation.mutate(selectedBill.id);
        }
    };

    // Helper to calculate status
    const getBillStatus = (dueDate) => {
        // Simple Recurring Logic: It's always "Monthly on X"
        return { label: `Monthly on ${dueDate}`, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400' };
    };

    // Helper to open edit modal
    const handleEdit = (bill) => {
        setSelectedBill(bill);
        setIsAddModalOpen(true);
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    if (variant === 'compact') {
        return (
            <div className="bg-white dark:bg-slate-900/40 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('Recurring Bills')}</h3>
                </div>
                <div className="space-y-4">
                    {isLoading ? (
                        <p className="text-slate-500 text-center">Loading bills...</p>
                    ) : bills && bills.length > 0 ? (
                        bills.map(bill => {
                            const status = getBillStatus(bill.dueDate);
                            return (
                                <div key={bill.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                                        <span className="material-symbols-outlined">receipt_long</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate pr-2">{bill.name}</span>
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                {formatCurrency(bill.amount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{t('Due day')}: {bill.dueDate}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">{t('No bills added yet.')}</p>
                            <Link to="/budget" className="text-emerald-500 font-bold text-sm hover:underline">
                                {t('Add in Budget')}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }} className="rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-white/5 text-white">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white">{t('Recurring Bills')}</h3>
                    <p className="text-slate-400 text-sm hidden sm:block">{t('Track monthly expenses like Rent or Netflix.')}</p>
                </div>
                <button
                    onClick={() => { setSelectedBill(null); setIsAddModalOpen(true); }}
                    className="flex items-center gap-2 text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    <span>{t('Add Bill')}</span>
                </button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2].map(i => (
                        <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            ) : bills && bills.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {bills.map(bill => {
                        const status = getBillStatus(bill.dueDate);
                        return (
                            <div key={bill.id} className="p-4 rounded-2xl bg-slate-800/50 border border-white/5 flex flex-col justify-between group relative hover:border-emerald-500/30 transition-all">
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(bill)}
                                        className="text-slate-400 hover:text-emerald-500 transition-colors p-1"
                                    >
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button
                                        onClick={() => { setSelectedBill(bill); setIsDeleteModalOpen(true); }}
                                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>

                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                                            <span className="material-symbols-outlined">receipt_long</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{bill.name}</h4>
                                            <p className="text-xs text-slate-400">{bill.category}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>
                                        {status.label}
                                    </span>
                                </div>

                                <div className="flex items-end justify-between mt-2 pl-1">
                                    <p className="text-lg font-bold text-white">{formatCurrency(bill.amount)}</p>
                                    <p className="text-xs font-medium text-slate-400">{t('Due day')}: {bill.dueDate}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                    <p className="text-slate-400 text-sm mb-2">{t('No bills added yet.')}</p>
                    <button
                        onClick={() => { setSelectedBill(null); setIsAddModalOpen(true); }}
                        className="text-emerald-500 font-bold text-sm hover:underline"
                    >
                        {t('Add your first bill')}
                    </button>
                </div>
            )}

            {/* Add/Edit Bill Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={selectedBill ? t('Edit Bill') : t('Add New Bill')}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label htmlFor="bill-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Bill Name')}</label>
                        <input
                            id="bill-name"
                            {...register('name', { required: true })}
                            placeholder="e.g. Rent, Netflix"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="bill-amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Amount')}</label>
                            <input
                                id="bill-amount"
                                type="number"
                                step="any"
                                {...register('amount', { required: true, min: 0 })}
                                placeholder="0.00"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                        <div>
                            <label htmlFor="bill-due-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Due Date')}</label>
                            <input
                                id="bill-due-date"
                                type="date"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const day = new Date(e.target.value).getDate();
                                        setValue('dueDate', day);
                                    }
                                }}
                            />
                            <input
                                type="hidden"
                                {...register('dueDate', { required: true })}
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="bill-category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Category')}</label>
                        <select
                            id="bill-category"
                            {...register('category')}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        >
                            <option value="Utilities">{t('Utilities')}</option>
                            <option value="Rent">{t('Rent')}</option>
                            <option value="Subscription">{t('Subscription')}</option>
                            <option value="Internet">{t('Internet')}</option>
                            <option value="Insurance">{t('Insurance')}</option>
                            <option value="Other">{t('Other')}</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                        >
                            {t('Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                        >
                            {isPending ? t('Saving...') : (selectedBill ? t('Save Changes') : t('Save Bill'))}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title={t('Delete Bill')}
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">
                        {t('Are you sure you want to delete')} <span className="font-bold text-slate-900 dark:text-white">{selectedBill?.name}</span>?
                        {t(' This action cannot be undone.')}
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                        >
                            {t('Cancel')}
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="px-6 py-2 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
                        >
                            {deleteMutation.isPending ? t('Deleting...') : t('Delete')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
