import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';

export default function WelcomeModal() {
    const { user } = useAuth();
    const { t } = usePreferences();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (user) {
            const createdAt = new Date(user.createdAt).getTime();
            const now = Date.now();
            const isNewUser = (now - createdAt) < 60000; // Created within last minute

            // Also check if we already showed it to avoid re-showing on refresh within that minute
            const hasSeenWelcome = localStorage.getItem(`welcome_${user.id}`);

            if (isNewUser && !hasSeenWelcome) {
                setIsOpen(true);
            }
        }
    }, [user]);

    const handleClose = () => {
        setIsOpen(false);
        if (user) {
            localStorage.setItem(`welcome_${user.id}`, 'true');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm z-[100]">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-8 -mt-8"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/10 rounded-tr-full -ml-8 -mb-8"></div>

                <div className="relative z-10 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                        <span className="material-symbols-outlined text-3xl text-white">celebration</span>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {t('Welcome to FinDash!')}
                    </h2>

                    <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                        {t('Your account has been successfully created. We\'re excited to help you take control of your financial journey.')}
                    </p>

                    <button
                        onClick={handleClose}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                    >
                        {t('Let\'s Get Started')}
                    </button>
                </div>
            </div>
        </div>
    );
}
