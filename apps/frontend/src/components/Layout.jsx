import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationDropdown from './NotificationDropdown';
import { useSidebar } from '../context/SidebarContext';
import { usePreferences } from '../context/PreferencesContext';
import WelcomeModal from './WelcomeModal';

export default function Layout({ children, hideHeader = false }) {
    const { toggleSidebar } = useSidebar();
    const { t } = usePreferences();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/transactions?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    // Get page title based on current route
    const getPageTitle = () => {
        const path = location.pathname;
        const titles = {
            '/': t('Dashboard'),
            '/statistics': t('Statistics'),
            '/budget': t('Budget'),
            '/transactions': t('Transactions'),
            '/settings': t('Settings'),
            '/billing': t('Billing'),
        };
        return titles[path] || t('Dashboard');
    };

    return (
        <div className="relative flex min-h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <Sidebar />

            <div className={`flex-1 flex flex-col lg:pl-64 transition-all duration-300 ${hideHeader ? 'h-screen overflow-hidden' : ''}`}>
                {/* Header */}
                {!hideHeader && (
                    <header className="sticky top-0 z-40 w-full glass-header px-6 py-4">
                        <div className="flex items-center justify-between gap-4">
                            {/* Mobile Menu & Logo */}
                            <div className="lg:hidden flex items-center gap-3 shrink-0">
                                <button className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50" onClick={toggleSidebar}>
                                    <span className="material-symbols-outlined">menu</span>
                                </button>
                                <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#10B981]/20 to-[#06B6D4]/20 text-[#10B981]">
                                    <span className="material-symbols-outlined">account_balance_wallet</span>
                                </div>
                            </div>

                            {/* Page Title */}
                            <div className="hidden lg:flex items-center shrink-0">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-display">{getPageTitle()}</h1>
                            </div>

                            {/* Search */}
                            <div className="flex-1 flex justify-center max-w-2xl mx-auto w-full">
                                <div className="relative w-full max-w-md">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">search</span>
                                    <input
                                        id="header-search"
                                        name="search"
                                        className="w-full rounded-xl bg-white/50 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-white/10 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-50 placeholder-slate-400 focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none transition-all"
                                        placeholder="Search transactions... (Press Enter)"
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleSearch}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 shrink-0">
                                { /* Integrated Notification System */}
                                <NotificationDropdown />
                                {/* Desktop Actions */}
                                <div className="hidden md:flex items-center gap-3">
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsHelpOpen(!isHelpOpen)}
                                            className="size-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            title="Help & Support"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">help</span>
                                        </button>
                                        {/* Desktop Help Dropdown */}
                                        {isHelpOpen && (
                                            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                                <div className="p-1">
                                                    <button onClick={() => { setIsHelpOpen(false); window.open('https://help.financialplanner.com', '_blank'); }} className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-lg">support_agent</span>
                                                        Contact Support
                                                    </button>
                                                    <button onClick={() => { setIsHelpOpen(false); window.open('https://docs.financialplanner.com', '_blank'); }} className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-lg">description</span>
                                                        Documentation
                                                    </button>
                                                    <button onClick={() => { setIsHelpOpen(false); window.open('https://help.financialplanner.com/faq', '_blank'); }} className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-lg">quiz</span>
                                                        FAQ
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Mobile Help Toggle (Visible only on small screens < md) */}
                                <div className="flex md:hidden items-center gap-3 border-l border-white/10 pl-4 relative">
                                    <button
                                        onClick={() => setIsHelpOpen(!isHelpOpen)}
                                        className="size-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">help</span>
                                    </button>
                                    {/* Mobile Dropdown reused or separate? Separate to avoid positioning issues */}
                                    {isHelpOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-slate-900 border border-white/10 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="p-1">
                                                <button onClick={() => { setIsHelpOpen(false); window.open('https://help.financialplanner.com', '_blank'); }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-lg">support_agent</span>
                                                    Contact Support
                                                </button>
                                                <button onClick={() => { setIsHelpOpen(false); window.open('https://docs.financialplanner.com', '_blank'); }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-lg">description</span>
                                                    Documentation
                                                </button>
                                                <button onClick={() => { setIsHelpOpen(false); window.open('https://help.financialplanner.com/faq', '_blank'); }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-lg">quiz</span>
                                                    FAQ
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>
                )}

                {/* Main Content Area */}
                {hideHeader ? (
                    children
                ) : (
                    <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-7xl">
                            {children}
                        </div>
                    </main>
                )}
            </div>
            <WelcomeModal />
        </div>
    );
}
