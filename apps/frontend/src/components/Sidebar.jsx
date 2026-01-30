import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../hooks/useUser';

export default function Sidebar() {
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { isSidebarOpen, closeSidebar } = useSidebar();
    const { t } = usePreferences();
    const { signOut } = useAuth();
    const { data: user } = useUser();

    // User data from API (reactive)
    const planName = user?.subscription?.plan ? user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1) : 'Free';
    const name = user?.name || 'User';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const menuItems = [
        { name: t('Home'), icon: 'home', path: '/' },
        { name: t('Statistics'), icon: 'bar_chart', path: '/statistics' },
        { name: t('Budget'), icon: 'savings', path: '/budget' },
        { name: t('Transactions'), icon: 'payments', path: '/transactions' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
                    onClick={closeSidebar}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-[100] w-64 flex flex-col glass-sidebar transition-transform duration-300 lg:translate-x-0 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                {/* User Info */}
                {/* Logo & Brand */}
                <div className="flex h-24 items-center gap-3 px-6 border-b border-slate-200 dark:border-white/5 shrink-0">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-slate-900 shadow-lg shadow-emerald-500/20">
                        <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">FinanceFlow</h1>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-1">Management</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-2 px-4 py-8 overflow-y-auto font-display">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => closeSidebar()} // Close on navigation
                                className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive
                                    ? 'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-50'
                                    }`}
                            >
                                <span className={`material-symbols-outlined ${isActive
                                    ? 'gradient-icon-primary'
                                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-50 transition-colors'
                                    }`}>
                                    {item.icon}
                                </span>
                                <span className={`font-medium text-[16px] ${isActive
                                    ? 'gradient-text-primary'
                                    : ''
                                    }`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Dropdown */}
                <div className="p-6 border-t border-slate-200 dark:border-white/5 relative mt-auto">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-800/50 py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                                {initials}
                            </div>
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate w-full text-left">{name}</span>
                                <span className="text-[10px] text-emerald-400">{planName} {t('Member')}</span>
                            </div>
                        </div>
                        <span className={`material-symbols-outlined text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute bottom-full left-6 right-6 mb-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden backdrop-blur-md z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
                            <div className="py-1">
                                <Link to="/settings" onClick={closeSidebar} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">person</span>
                                    {t('Settings')}
                                </Link>
                                <Link to="/billing" onClick={closeSidebar} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">credit_card</span>
                                    {t('Billing')}
                                </Link>
                                <div className="h-px bg-slate-200 dark:bg-white/5 my-1"></div>
                                <button onClick={() => { signOut(); closeSidebar(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10 transition-colors text-left">
                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                    {t('Sign Out')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
