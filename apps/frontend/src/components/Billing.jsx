import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSidebar } from '../context/SidebarContext';
import { usePreferences } from '../context/PreferencesContext';
import { useSubscription, useBillingHistory, usePlans, useUpgradeSubscription, useDowngradeSubscription } from '../hooks/useSubscription';
import { useAuth } from '../context/AuthContext';
import { userKeys } from '../hooks/useUser';
import Modal from './Modal';

export default function Billing() {
    const { toggleSidebar } = useSidebar();
    const { formatCurrency, t } = usePreferences();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch data from API
    const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
    const { data: billingHistory, isLoading: billingLoading } = useBillingHistory();
    const { data: plans, isLoading: plansLoading } = usePlans();

    // Mutations
    const upgradeMutation = useUpgradeSubscription();
    const downgradeMutation = useDowngradeSubscription();

    // Modal state
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Voucher code state
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [voucherMessage, setVoucherMessage] = useState('');
    const [voucherSuccess, setVoucherSuccess] = useState(false);

    // Valid voucher codes (in production, this would be validated on the backend)
    const validVouchers = {
        'PRO2026': { planId: 'pro', duration: '1 month' },
        'ENTERPRISE2026': { planId: 'enterprise', duration: '1 month' },
        'FREEUPGRADE': { planId: 'pro', duration: '7 days' },
    };

    // Handle voucher redemption
    const handleRedeemVoucher = async () => {
        setVoucherLoading(true);
        setVoucherMessage('');

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const voucher = validVouchers[voucherCode.trim().toUpperCase()];
        if (voucher) {
            try {
                await upgradeMutation.mutateAsync(voucher.planId);
                setVoucherSuccess(true);
                setVoucherMessage(`🎉 Success! Your account has been upgraded to ${voucher.planId.toUpperCase()} plan for ${voucher.duration}!`);
                setVoucherCode('');
            } catch (error) {
                setVoucherSuccess(false);
                setVoucherMessage(error.response?.data?.error || error.message || 'Failed to apply voucher. Please try again.');
            }
        } else {
            setVoucherSuccess(false);
            setVoucherMessage('Invalid voucher code. Please check and try again.');
        }
        setVoucherLoading(false);
        // Force refresh of subscription data
        queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
        queryClient.invalidateQueries({ queryKey: ['user-billing-history'] });
        // Force refresh of user data (for Sidebar/Profile status)
        queryClient.invalidateQueries({ queryKey: userKeys.current() });
    };

    // Skeleton component
    const Skeleton = ({ className }) => (
        <div className={`animate-pulse bg-slate-700/50 rounded ${className}`}></div>
    );

    // Get current plan details
    const currentPlan = subscription?.plan || 'free';
    const planName = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);
    const isActive = subscription?.status === 'active';
    const renewDate = subscription?.renewAt ? new Date(subscription.renewAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }) : null;

    // Calculate days remaining
    const daysRemaining = subscription?.renewAt
        ? Math.max(0, Math.ceil((new Date(subscription.renewAt) - new Date()) / (1000 * 60 * 60 * 24)))
        : 0;
    const usagePercent = renewDate ? Math.round((1 - daysRemaining / 30) * 100) : 0;

    // Default billing history if none from API
    const displayBillingHistory = Array.isArray(billingHistory) && billingHistory.length > 0 ? billingHistory : [];

    // Default plans if none from API
    const displayPlans = Array.isArray(plans) ? plans : [
        { id: 'free', name: 'Basic', price: 0, description: 'For casual tracking', features: ['5 Wallets', 'Basic Analytics', 'Manual Sync'] },
        { id: 'pro', name: 'Pro', price: 29, description: 'For serious budgeters', features: ['Unlimited Wallets', 'Advanced Analytics', 'Auto-Bank Sync', 'Export to CSV'] },
        { id: 'enterprise', name: 'Enterprise', price: 99, description: 'For families & small biz', features: ['Everything in Pro', 'Priority Support', 'Multiple Users', 'Custom API Access'] }
    ];

    // Handle plan selection
    const handleSelectPlan = (plan) => {
        if (plan.id === currentPlan) return;
        setSelectedPlan(plan);
        setShowUpgradeModal(true);
    };

    // Handle upgrade/downgrade confirmation
    const handleConfirmPlanChange = async () => {
        if (!selectedPlan) return;
        setIsProcessing(true);

        try {
            const planIndex = displayPlans.findIndex(p => p.id === selectedPlan.id);
            const currentIndex = displayPlans.findIndex(p => p.id === currentPlan);

            if (planIndex > currentIndex) {
                await upgradeMutation.mutateAsync(selectedPlan.id);
            } else {
                await downgradeMutation.mutateAsync({ planId: selectedPlan.id });
            }
            setShowUpgradeModal(false);
            setSelectedPlan(null);
        } catch (error) {
            console.error('Plan change failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle invoice download
    const handleDownloadInvoice = (invoice) => {
        const invoiceContent = [
            '================================================',
            '                    INVOICE                     ',
            '================================================',
            '',
            `${t('Invoice Date')}: ${new Date(invoice.paidAt || invoice.createdAt).toLocaleDateString()}`,
            `${t('Invoice ID')}: INV-${invoice.id}`,
            '',
            '------------------------------------------------',
            `${t('Description')}: ${invoice.description}`,
            `${t('Amount')}: ${formatCurrency(invoice.amount)}`,
            `${t('Status')}: ${invoice.status.toUpperCase()}`,
            '------------------------------------------------',
            '',
            t('Thank you for your business!'),
            t('Financial Planner - Your Personal Finance Assistant')
        ].join('\n');

        const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);

        // Fix for invalid date error
        const dateObj = new Date(invoice.paidAt || invoice.createdAt);
        const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : 'unknown_date';

        link.download = `invoice_${invoice.id}_${dateStr}.txt`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-all duration-300">
            <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 custom-scrollbar">
                <div className="max-w-6xl mx-auto flex flex-col gap-6 pt-6">
                    <div className="mb-2">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('Billing & Subscription')}</h1>
                        <p className="text-slate-500 dark:text-slate-400">{t('Manage your plan, payment methods, and billing history.')}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Current Plan Card */}
                        <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group min-h-[240px]">
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                            {subscriptionLoading ? (
                                <div className="space-y-4 z-10">
                                    <Skeleton className="h-6 w-24" />
                                    <Skeleton className="h-10 w-40" />
                                    <Skeleton className="h-4 w-full mt-8" />
                                    <Skeleton className="h-2 w-full" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col sm:flex-row justify-between items-start z-10 gap-4">
                                        <div>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{t('Current Plan')}</p>
                                            <div className="flex items-baseline gap-2 flex-wrap">
                                                <h2 className="text-slate-900 dark:text-white text-3xl sm:text-4xl font-bold">{planName} {t('Plan')}</h2>
                                                <span className="text-lg text-slate-500 dark:text-slate-400 font-medium">/ {t('month')}</span>
                                            </div>
                                        </div>
                                        {isActive && (
                                            <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-1 self-start sm:self-auto">
                                                <span className="material-symbols-outlined text-sm">verified</span>
                                                {t('ACTIVE')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-4 mt-8 z-10">
                                        {renewDate && (
                                            <>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                                                        <span>{t('Current Usage')}</span>
                                                        <span>{daysRemaining} {t('days left')}</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${usagePercent}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                                                    <span className="material-symbols-outlined text-lg">autorenew</span>
                                                    {t('Renews automatically on')} {renewDate}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Payment Method Card */}
                        <div className="glass-credit-card rounded-3xl p-8 flex flex-col justify-between relative min-h-[240px] shadow-2xl">
                            {subscriptionLoading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-8 w-12" />
                                    <Skeleton className="h-8 w-48 mt-8" />
                                    <div className="flex justify-between mt-8">
                                        <Skeleton className="h-6 w-24" />
                                        <Skeleton className="h-6 w-16" />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start">
                                        <div className="bg-white/20 backdrop-blur-sm rounded-md w-12 h-8 flex items-center justify-center">
                                            <div className="w-8 h-5 border border-white/40 rounded-[2px] grid grid-cols-2 gap-px relative overflow-hidden">
                                                <div className="border-r border-white/40"></div>
                                                <div className="absolute top-1/2 left-0 w-full h-px bg-white/40"></div>
                                            </div>
                                        </div>
                                        <span className="text-white/90 font-mono text-xl italic font-bold tracking-widest drop-shadow-lg">VISA</span>
                                    </div>
                                    <div className="flex flex-col gap-2 my-4">
                                        <p className="text-white/60 text-xs uppercase tracking-widest">Card Number</p>
                                        <div className="flex items-center gap-4 text-white text-2xl font-mono tracking-widest shadow-black drop-shadow-md">
                                            <span>••••</span>
                                            <span>••••</span>
                                            <span>••••</span>
                                            <span>{subscription?.paymentMethod?.last4 || '4242'}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1">Card Holder</p>
                                            <p className="text-white text-sm font-bold tracking-wide uppercase text-shadow">{user?.name || 'Card Holder'}</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1">Expires</p>
                                            <p className="text-white text-sm font-bold tracking-wide text-shadow">{subscription?.paymentMethod?.expiry || '12/25'}</p>
                                        </div>
                                    </div>
                                    <button aria-label="Edit payment method" className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-2">
                                        <span className="material-symbols-outlined text-xl">edit</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Billing History */}
                        <div className="glass-panel rounded-3xl overflow-hidden border border-slate-200 dark:border-white/5 lg:col-span-2">
                            <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Billing History</h3>
                                <button className="text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors flex items-center gap-1">
                                    View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>
                            <div className="mt-4">
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4 font-medium">Date</th>
                                                <th className="px-6 py-4 font-medium">Description</th>
                                                <th className="px-6 py-4 font-medium">Amount</th>
                                                <th className="px-6 py-4 font-medium">Status</th>
                                                <th className="px-6 py-4 font-medium text-right">Invoice</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-sm">
                                            {billingLoading ? (
                                                Array(3).fill(0).map((_, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                                                        <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                                                        <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                                                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                                        <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></td>
                                                    </tr>
                                                ))
                                            ) : displayBillingHistory.length > 0 ? (
                                                displayBillingHistory.map((item) => (
                                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                                        <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                                                            {new Date(item.paidAt || item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.description}</td>
                                                        <td className="px-6 py-4 text-slate-900 dark:text-white font-mono">{formatCurrency(item.amount)}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${item.status === 'paid'
                                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                                }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'paid' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                                                {item.status === 'paid' ? 'Paid' : 'Failed'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => handleDownloadInvoice(item)}
                                                                className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <span className="material-symbols-outlined">download</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                                        <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">receipt_long</span>
                                                        No billing history yet
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden flex flex-col gap-4 p-4">
                                    {billingLoading ? (
                                        Array(3).fill(0).map((_, idx) => (
                                            <div key={idx} className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                                                <div className="flex justify-between mb-3">
                                                    <Skeleton className="h-5 w-32" />
                                                    <Skeleton className="h-5 w-16" />
                                                </div>
                                                <Skeleton className="h-4 w-24 mb-3" />
                                                <div className="flex justify-between items-center">
                                                    <Skeleton className="h-6 w-20" />
                                                    <Skeleton className="h-8 w-8" />
                                                </div>
                                            </div>
                                        ))
                                    ) : displayBillingHistory.length > 0 ? (
                                        displayBillingHistory.map((item) => (
                                            <div key={item.id} className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex flex-col gap-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-slate-900 dark:text-white font-medium text-sm">{item.description}</p>
                                                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                                                            {new Date(item.paidAt || item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'paid'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                        }`}>
                                                        {item.status === 'paid' ? 'Paid' : 'Failed'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/5 pt-3 mt-1">
                                                    <span className="text-slate-900 dark:text-white font-mono font-bold">{formatCurrency(item.amount)}</span>
                                                    <button
                                                        onClick={() => handleDownloadInvoice(item)}
                                                        className="flex items-center gap-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors border border-emerald-500/20"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">download</span>
                                                        Invoice
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                            <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">receipt_long</span>
                                            No billing history yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Voucher Code Redemption */}
                    <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white">redeem</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Redeem Voucher Code</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Enter a voucher code to upgrade your plan without payment</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <input
                                    id="voucher-code"
                                    name="voucherCode"
                                    autoComplete="off"
                                    value={voucherCode}
                                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                    placeholder="Enter voucher code (e.g., PRO2026)"
                                    aria-label="Voucher Code"
                                    className="flex-1 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 font-mono tracking-wider uppercase transition-all"
                                />
                                <button
                                    onClick={handleRedeemVoucher}
                                    disabled={!voucherCode.trim() || voucherLoading}
                                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold hover:brightness-110 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {voucherLoading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                            Validating...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                            Redeem
                                        </>
                                    )}
                                </button>
                            </div>
                            {voucherMessage && (
                                <div className={`mt-3 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${voucherSuccess
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">{voucherSuccess ? 'check_circle' : 'error'}</span>
                                    {voucherMessage}
                                </div>
                            )}
                            <p className="text-slate-500 text-xs mt-3">Valid voucher codes: PRO2026, ENTERPRISE2026, FREEUPGRADE</p>
                        </div>
                    </div>

                    {/* Upgrade Options */}
                    <div className="flex flex-col gap-6 mb-8">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Upgrade Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plansLoading ? (
                                Array(3).fill(0).map((_, idx) => (
                                    <div key={idx} className="glass-panel rounded-3xl p-6 flex flex-col gap-4">
                                        <Skeleton className="h-6 w-24" />
                                        <Skeleton className="h-10 w-20" />
                                        <div className="space-y-3 flex-1">
                                            {Array(4).fill(0).map((_, i) => (
                                                <Skeleton key={i} className="h-5 w-full" />
                                            ))}
                                        </div>
                                        <Skeleton className="h-10 w-full rounded-xl mt-4" />
                                    </div>
                                ))
                            ) : (
                                displayPlans.map((plan) => {
                                    const isCurrent = currentPlan === plan.id;
                                    const planIndex = displayPlans.findIndex(p => p.id === plan.id);
                                    const currentIndex = displayPlans.findIndex(p => p.id === currentPlan);
                                    const isUpgrade = planIndex > currentIndex;

                                    return (
                                        <div key={plan.id} className={`glass-panel rounded-3xl p-6 flex flex-col gap-4 transition-colors duration-300 relative ${isCurrent
                                            ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-slate-50 dark:bg-slate-800/80'
                                            : 'hover:border-emerald-500/30'
                                            }`}>
                                            {isCurrent && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                                                    Current Plan
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="text-slate-900 dark:text-white text-lg font-bold">{plan.name}</h4>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{plan.description}</p>
                                            </div>
                                            <div className="flex items-baseline gap-1 my-2">
                                                <span className="text-3xl font-bold text-slate-900 dark:text-white">{plan.price === 0 ? 'Free' : `$${plan.price}`}</span>
                                                {plan.price > 0 && <span className="text-slate-500 dark:text-slate-400 text-sm">/mo</span>}
                                            </div>
                                            <ul className="flex flex-col gap-3 flex-1">
                                                {plan.features.map((feature, idx) => (
                                                    <li key={idx} className={`flex items-center gap-3 text-sm ${isCurrent ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        <span className={`material-symbols-outlined text-lg ${isCurrent ? 'text-emerald-500 dark:text-emerald-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                                                            {isCurrent ? 'check_circle' : 'check'}
                                                        </span>
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                            <button
                                                onClick={() => handleSelectPlan(plan)}
                                                disabled={isCurrent}
                                                className={`w-full py-2.5 rounded-xl font-medium transition-colors mt-4 ${isCurrent
                                                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-900 font-bold cursor-default'
                                                    : isUpgrade
                                                        ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-900 font-bold hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                                        : 'border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                                    }`}>
                                                {isCurrent ? 'Current Plan' : isUpgrade ? 'Upgrade' : 'Downgrade'}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Upgrade/Downgrade Modal */}
            <Modal
                isOpen={showUpgradeModal}
                onClose={() => { setShowUpgradeModal(false); setSelectedPlan(null); }}
                title={selectedPlan && displayPlans.findIndex(p => p.id === selectedPlan.id) > displayPlans.findIndex(p => p.id === currentPlan) ? 'Upgrade Plan' : 'Downgrade Plan'}
                size="sm"
            >
                {selectedPlan && (
                    <div className="flex flex-col gap-6">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center size-16 rounded-full bg-emerald-500/10 text-emerald-400 mb-4">
                                <span className="material-symbols-outlined text-3xl">
                                    {displayPlans.findIndex(p => p.id === selectedPlan.id) > displayPlans.findIndex(p => p.id === currentPlan) ? 'upgrade' : 'arrow_downward'}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                {displayPlans.findIndex(p => p.id === selectedPlan.id) > displayPlans.findIndex(p => p.id === currentPlan)
                                    ? `Upgrade to ${selectedPlan.name}`
                                    : `Downgrade to ${selectedPlan.name}`}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                {displayPlans.findIndex(p => p.id === selectedPlan.id) > displayPlans.findIndex(p => p.id === currentPlan)
                                    ? `You'll be charged ${formatCurrency(selectedPlan.price)}/month starting today.`
                                    : `Your plan will change at the end of the current billing period.`}
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-slate-500 dark:text-slate-400 text-sm">New Plan</span>
                                <span className="text-slate-900 dark:text-white font-bold">{selectedPlan.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400 text-sm">Price</span>
                                <span className="text-slate-900 dark:text-white font-bold">{selectedPlan.price === 0 ? 'Free' : `${formatCurrency(selectedPlan.price)}/mo`}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowUpgradeModal(false); setSelectedPlan(null); }}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmPlanChange}
                                disabled={isProcessing}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 text-sm font-bold hover:brightness-110 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                        Processing...
                                    </>
                                ) : (
                                    'Confirm'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
