import React, { useState } from 'react';
import { authClient } from '../lib/auth-client';
import { useSidebar } from '../context/SidebarContext';
import { usePreferences } from '../context/PreferencesContext';
import { useUser, useUpdateProfile } from '../hooks/useUser';
import { useAccounts, useDeleteAccount } from '../hooks/useAccounts';
import { useAuth } from '../context/AuthContext';
import LinkBankModal from './LinkBankModal';
import TwoFactorSettings from './TwoFactorSettings';
import ActiveSessions from './ActiveSessions';


export default function Settings() {
    const { toggleSidebar } = useSidebar();
    const { currency, setCurrency, language, setLanguage, theme, setTheme, t } = usePreferences();
    const { user } = useAuth();

    // Fetch user data from API
    const { data: userData, isLoading: userLoading } = useUser();
    const { data: accounts, isLoading: accountsLoading } = useAccounts();
    const updateProfileMutation = useUpdateProfile();
    const deleteAccountMutation = useDeleteAccount();

    // Modal state
    const [isLinkBankOpen, setIsLinkBankOpen] = useState(false);
    const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Initialize form with user data when loaded
    React.useEffect(() => {
        if (userData) {
            setFormData({
                name: userData.name || '',
                email: userData.email || '',
                phone: userData.phone || ''
            });
        }
    }, [userData]);

    // Skeleton component
    const Skeleton = ({ className }) => (
        <div className={`animate-pulse bg-slate-700/50 rounded ${className}`}></div>
    );

    // Handle profile update
    const handleProfileSubmit = (e) => {
        e.preventDefault();
        updateProfileMutation.mutate(formData);
    };

    // Handle password update
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const errors = {};

        // Only require current password if the user initialized with one (approximate check, better handled by API error)
        // For now, we will try to submit. If API fails, we show error.

        if (!passwordData.newPassword) errors.newPassword = t('New password is required');
        if (passwordData.newPassword.length < 8) errors.newPassword = t('Password must be at least 8 characters');
        if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = t('Passwords do not match');

        if (Object.keys(errors).length > 0) {
            setPasswordErrors(errors);
            return;
        }

        setIsUpdatingPassword(true);
        setPasswordErrors({});

        try {
            const { error } = await authClient.changePassword({
                newPassword: passwordData.newPassword,
                currentPassword: passwordData.currentPassword || undefined,
                revokeOtherSessions: true
            });

            if (error) {
                // Check if error is because password is not set
                if (error.message?.includes('current') || error.code === 'PASSWORD_NOT_Set') { // Check documentation for specific code
                    // If user has no password set, we might need a different flow or specific handling
                    // better-auth changePassword usually requires current password unless it's a "setPassword" flow.
                    // IMPORTANT: better-auth by default doesn't allow setting password without current if one exists.
                    // If one doesn't exist, it might still require a different endpoint or token.
                    // For now, let's display the error from backend.
                    setPasswordErrors({ currentPassword: error.message || t('Current password is required or incorrect') });
                } else {
                    setPasswordErrors({ general: error.message || t('Failed to update password') });
                }
                return;
            }

            setShowPasswordSuccess(true);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setShowPasswordSuccess(false), 3000);
        } catch (error) {
            console.error(error);
            setPasswordErrors({ general: t('An unexpected error occurred') });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    // Handle account disconnect
    const handleDisconnectAccount = (accountId) => {
        if (confirm('Are you sure you want to disconnect this account?')) {
            deleteAccountMutation.mutate(accountId);
        }
    };

    // Get user display data
    const displayUser = userData || user || {};
    const displayName = displayUser.name || t('User');
    const displayEmail = displayUser.email || 'user@example.com';
    const isPro = displayUser.subscription?.plan === 'pro' || false;

    return (
        <div className="flex-1 flex flex-col transition-all duration-300 bg-slate-50 dark:bg-slate-900 h-full overflow-hidden relative">
            <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8 custom-scrollbar">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">{t('Settings & Account')}</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('Manage your personal information and preferences.')}</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-sm font-bold text-white hover:brightness-110 shadow-md active:scale-95 transition-all">
                            <span className="material-symbols-outlined text-[18px]">help</span>
                            <span>{t('Help & Support')}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-1 flex flex-col gap-6">
                            {/* Profile Card */}
                            <div className="glass-card rounded-3xl overflow-hidden relative group">
                                <div className="h-28 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-white/5 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-primary-start/5"></div>
                                    <div className="absolute -right-6 -top-12 size-32 bg-primary-start/10 rounded-full blur-2xl"></div>
                                </div>
                                <div className="px-6 pb-6 relative z-10">
                                    <div className="flex justify-between items-end -mt-12 mb-6">
                                        <div className="relative">
                                            <div className="size-24 rounded-full p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl">
                                                <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-3xl font-bold text-slate-900">
                                                    {displayName[0]?.toUpperCase() || 'U'}
                                                </div>
                                            </div>
                                            <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg hover:brightness-110 hover:scale-105 transition-all">
                                                <span className="material-symbols-outlined text-[16px] font-bold">edit</span>
                                            </button>
                                        </div>
                                        {isPro && (
                                            <div className="mb-2">
                                                <span className="px-3 py-1 rounded-full bg-primary-start/10 border border-primary-start/20 text-primary-start text-xs font-bold">PRO</span>
                                            </div>
                                        )}
                                    </div>
                                    <form className="space-y-4" onSubmit={handleProfileSubmit}>
                                        <div className="space-y-1.5">
                                            <label htmlFor="settings-name" className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('Full Name')}</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 material-symbols-outlined text-[18px]">person</span>
                                                {userLoading ? (
                                                    <Skeleton className="w-full h-10" />
                                                ) : (
                                                    <input
                                                        id="settings-name"
                                                        name="name"
                                                        autoComplete="name"
                                                        className="w-full rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 py-2.5 pl-9 pr-4 text-sm text-slate-900 dark:text-slate-50 focus:border-primary-start focus:ring-1 focus:ring-primary-start outline-none transition-all"
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="settings-email" className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('Email Address')}</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 material-symbols-outlined text-[18px]">mail</span>
                                                {userLoading ? (
                                                    <Skeleton className="w-full h-10" />
                                                ) : (
                                                    <input
                                                        id="settings-email"
                                                        name="email"
                                                        autoComplete="email"
                                                        className="w-full rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 py-2.5 pl-9 pr-4 text-sm text-slate-900 dark:text-slate-50 focus:border-primary-start focus:ring-1 focus:ring-primary-start outline-none transition-all"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="settings-phone" className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('Phone Number')}</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 material-symbols-outlined text-[18px]">call</span>
                                                {userLoading ? (
                                                    <Skeleton className="w-full h-10" />
                                                ) : (
                                                    <input
                                                        id="settings-phone"
                                                        name="phone"
                                                        autoComplete="tel"
                                                        className="w-full rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 py-2.5 pl-9 pr-4 text-sm text-slate-900 dark:text-slate-50 focus:border-primary-start focus:ring-1 focus:ring-primary-start outline-none transition-all"
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={updateProfileMutation.isPending}
                                            className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {updateProfileMutation.isPending ? (
                                                <>
                                                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                                    Saving...
                                                </>
                                            ) : updateProfileMutation.isSuccess ? (
                                                <>
                                                    <span className="material-symbols-outlined text-[18px]">check</span>
                                                    Saved!
                                                </>
                                            ) : (
                                                t('Save Changes')
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Preferences Card */}
                            <div className="glass-card p-6 rounded-3xl">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary-start">tune</span>
                                    {t('Preferences')}
                                </h3>
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-400 ml-1">{t('Currency')}</label>
                                        <div className="relative">
                                            <select
                                                id="settings-currency"
                                                name="currency"
                                                value={currency}
                                                onChange={(e) => setCurrency(e.target.value)}
                                                className="w-full appearance-none rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 py-2.5 pl-4 pr-10 text-sm text-slate-900 dark:text-slate-50 focus:border-primary-start focus:ring-1 focus:ring-primary-start outline-none cursor-pointer"
                                            >
                                                <option value="USD">USD - US Dollar ($)</option>
                                                <option value="EUR">EUR - Euro (€)</option>
                                                <option value="GBP">GBP - British Pound (£)</option>
                                                <option value="IDR">IDR - Indonesian Rupiah (Rp)</option>
                                            </select>
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px] pointer-events-none">expand_more</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-400 ml-1">{t('Language')}</label>
                                        <div className="relative">
                                            <select
                                                id="settings-language"
                                                name="language"
                                                value={language}
                                                onChange={(e) => setLanguage(e.target.value)}
                                                className="w-full appearance-none rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 py-2.5 pl-4 pr-10 text-sm text-slate-900 dark:text-slate-50 focus:border-primary-start focus:ring-1 focus:ring-primary-start outline-none cursor-pointer"
                                            >
                                                <option value="en">English (United States)</option>
                                                <option value="es">Spanish (Español)</option>
                                                <option value="fr">French (Français)</option>
                                                <option value="id">Indonesian (Bahasa Indonesia)</option>
                                            </select>
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px] pointer-events-none">expand_more</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-900 dark:text-slate-50">{t('Dark Mode')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Adjust system theme</span>
                                        </div>
                                        <button
                                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                            className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none ${theme === 'dark' ? 'bg-gradient-to-r from-primary-start to-primary-end' : 'bg-slate-200'}`}
                                        >
                                            <span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}></span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="xl:col-span-2 flex flex-col gap-6">
                            {/* Connected Accounts */}
                            <div className="glass-card p-6 sm:p-8 rounded-3xl">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary-start">account_balance</span>
                                            {t('Connected Accounts')}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('Manage your synced bank accounts.')}</p>
                                    </div>
                                    <button
                                        onClick={() => setIsLinkBankOpen(true)}
                                        className="hidden sm:flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 text-sm font-bold text-white transition-all hover:brightness-110 hover:shadow-lg active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">add_link</span>
                                        <span>{t('Link Bank')}</span>
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {accountsLoading ? (
                                        Array(3).fill(0).map((_, idx) => (
                                            <div key={idx} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                                                <div className="flex items-center gap-4">
                                                    <Skeleton className="size-12 rounded-xl" />
                                                    <div>
                                                        <Skeleton className="h-5 w-32 mb-1" />
                                                        <Skeleton className="h-3 w-24" />
                                                    </div>
                                                </div>
                                                <Skeleton className="h-8 w-20 rounded-lg" />
                                            </div>
                                        ))
                                    ) : accounts && accounts.length > 0 ? (
                                        accounts.map((account) => (
                                            <div key={account.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`size-12 rounded-xl p-2 flex items-center justify-center border ${account.type === 'bank' ? 'bg-primary-start/10 border-primary-start/20 text-primary-start' :
                                                        account.type === 'wallet' ? 'bg-[#0EA5E9]/10 border-[#0EA5E9]/20 text-[#0EA5E9]' :
                                                            'bg-[#635BFF]/10 border-[#635BFF]/20 text-[#635BFF]'
                                                        }`}>
                                                        <span className="material-symbols-outlined text-2xl">
                                                            {account.type === 'bank' ? 'account_balance' :
                                                                account.type === 'wallet' ? 'account_balance_wallet' : 'credit_card'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{account.name}</p>
                                                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">{t('Synced')}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Balance: ${account.balance?.toLocaleString() || 0}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                                    <button className="flex-1 sm:flex-none py-2 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-xs font-bold text-white hover:brightness-110 transition-all shadow-md active:scale-95">{t('Sync Now')}</button>
                                                    <button
                                                        onClick={() => handleDisconnectAccount(account.id)}
                                                        disabled={deleteAccountMutation.isPending}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                                                        title="Disconnect Account"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                            <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">account_balance</span>
                                            <p>No accounts connected yet.</p>
                                            <button
                                                onClick={() => setIsLinkBankOpen(true)}
                                                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-sm font-bold text-white hover:brightness-110 transition-all shadow-lg active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">add_link</span>
                                                Link your first account
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Security Section */}
                            <div className="glass-card p-6 sm:p-8 rounded-3xl">
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary-start">security</span>
                                        {t('Security')}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update your password and secure your account.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">{t('Change Password')}</h4>

                                        {showPasswordSuccess && (
                                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                                Password updated successfully!
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <label htmlFor="settings-current-password" className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('Current Password')}</label>
                                            <input
                                                id="settings-current-password"
                                                name="currentPassword"
                                                autoComplete="current-password"
                                                className={`w-full rounded-xl bg-white dark:bg-slate-900/50 border py-2.5 px-4 text-sm text-slate-900 dark:text-slate-50 focus:ring-1 focus:ring-primary-start outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${passwordErrors.currentPassword ? 'border-rose-500' : 'border-slate-200 dark:border-white/10 focus:border-primary-start'
                                                    }`}
                                                placeholder="Enter current password"
                                                type="password"
                                                value={passwordData.currentPassword}
                                                onChange={(e) => {
                                                    setPasswordData({ ...passwordData, currentPassword: e.target.value });
                                                    if (passwordErrors.currentPassword) setPasswordErrors({ ...passwordErrors, currentPassword: '' });
                                                }}
                                            />
                                            {passwordErrors.currentPassword && (
                                                <p className="text-rose-400 text-xs ml-1">{passwordErrors.currentPassword}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="settings-new-password" className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('New Password')}</label>
                                            <input
                                                id="settings-new-password"
                                                name="newPassword"
                                                autoComplete="new-password"
                                                className={`w-full rounded-xl bg-white dark:bg-slate-900/50 border py-2.5 px-4 text-sm text-slate-900 dark:text-slate-50 focus:ring-1 focus:ring-primary-start outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${passwordErrors.newPassword ? 'border-rose-500' : 'border-slate-200 dark:border-white/10 focus:border-primary-start'
                                                    }`}
                                                placeholder="Enter new password"
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => {
                                                    setPasswordData({ ...passwordData, newPassword: e.target.value });
                                                    if (passwordErrors.newPassword) setPasswordErrors({ ...passwordErrors, newPassword: '' });
                                                }}
                                            />
                                            {passwordErrors.newPassword && (
                                                <p className="text-rose-400 text-xs ml-1">{passwordErrors.newPassword}</p>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="settings-confirm-password" className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">{t('Confirm New Password')}</label>
                                            <input
                                                id="settings-confirm-password"
                                                name="confirmPassword"
                                                autoComplete="new-password"
                                                className={`w-full rounded-xl bg-white dark:bg-slate-900/50 border py-2.5 px-4 text-sm text-slate-900 dark:text-slate-50 focus:ring-1 focus:ring-primary-start outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 ${passwordErrors.confirmPassword ? 'border-rose-500' : 'border-slate-200 dark:border-white/10 focus:border-primary-start'
                                                    }`}
                                                placeholder="Confirm new password"
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => {
                                                    setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                                                    if (passwordErrors.confirmPassword) setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                                                }}
                                            />
                                            {passwordErrors.confirmPassword && (
                                                <p className="text-rose-400 text-xs ml-1">{passwordErrors.confirmPassword}</p>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isUpdatingPassword}
                                            className="mt-2 w-full sm:w-auto px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isUpdatingPassword ? (
                                                <>
                                                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                                    Updating...
                                                </>
                                            ) : (
                                                t('Update Password')
                                            )}
                                        </button>
                                    </form>
                                    <div className="relative md:border-l md:border-slate-200 dark:md:border-white/5 md:pl-8 pt-6 md:pt-0 border-t border-slate-200 dark:border-white/5 md:border-t-0 mt-2 md:mt-0">
                                        <TwoFactorSettings user={displayUser} twoFactor={useAuth().twoFactor} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Active Sessions */}
                        <ActiveSessions />

                        {/* Danger Zone */}
                        <div className="glass-card p-6 sm:p-8 rounded-3xl border-rose-500/20">
                            <h3 className="text-lg font-bold text-rose-500 flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined">warning</span>
                                {t('Danger Zone')}
                            </h3>
                            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t('Delete Account')}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('Permanently delete your account and all data.')}</p>
                                </div>
                                <button
                                    className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                                    onClick={async () => {
                                        if (confirm(t('Are you sure you want to delete your account? This action cannot be undone.'))) {
                                            try {
                                                const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/users/me`, {
                                                    method: 'DELETE',
                                                    headers: {
                                                        'Content-Type': 'application/json'
                                                    },
                                                    credentials: 'include'
                                                });

                                                if (res.ok) {
                                                    window.location.href = '/';
                                                } else {
                                                    alert(t('Failed to delete account'));
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                alert(t('An error occurred'));
                                            }
                                        }
                                    }}
                                >
                                    {t('Delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main >

            {/* Link Bank Modal */}
            < LinkBankModal
                isOpen={isLinkBankOpen}
                onClose={() => setIsLinkBankOpen(false)
                }
            />
        </div >
    );
}
