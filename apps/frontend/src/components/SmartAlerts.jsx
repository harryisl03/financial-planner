import React from 'react';
import { usePreferences } from '../context/PreferencesContext';

export default function SmartAlerts({ alerts = [] }) {
    const { t } = usePreferences();

    const getAlertStyle = (type) => {
        switch (type) {
            case 'danger':
                return {
                    bg: 'bg-rose-50 dark:bg-rose-900/20',
                    border: 'border-rose-100 dark:border-rose-500/20',
                    icon: 'text-rose-500',
                    title: 'text-rose-900 dark:text-rose-100',
                    text: 'text-rose-700 dark:text-rose-300',
                    iconName: 'warning'
                };
            case 'warning':
                return {
                    bg: 'bg-amber-50 dark:bg-amber-900/20',
                    border: 'border-amber-100 dark:border-amber-500/20',
                    icon: 'text-amber-500',
                    title: 'text-amber-900 dark:text-amber-100',
                    text: 'text-amber-700 dark:text-amber-300',
                    iconName: 'priority_high'
                };
            case 'success':
                return {
                    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                    border: 'border-emerald-100 dark:border-emerald-500/20',
                    icon: 'text-emerald-500',
                    title: 'text-emerald-900 dark:text-emerald-100',
                    text: 'text-emerald-700 dark:text-emerald-300',
                    iconName: 'check_circle'
                };
            case 'info':
            default:
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/20',
                    border: 'border-blue-100 dark:border-blue-500/20',
                    icon: 'text-blue-500',
                    title: 'text-blue-900 dark:text-blue-100',
                    text: 'text-blue-700 dark:text-blue-300',
                    iconName: 'info'
                };
        }
    };

    return (
        <div className="glass-card rounded-3xl flex-1 flex flex-col bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5">
            <div className="p-6 border-b border-slate-50 dark:border-white/5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{t('Smart Alerts')}</h3>
            </div>
            <div className="p-4 space-y-3">
                {alerts.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-sm">
                        {t('No new alerts. You\'re on track!')}
                    </div>
                ) : (
                    alerts.map((alert) => {
                        const style = getAlertStyle(alert.type);
                        return (
                            <div key={alert.id} className={`p-4 rounded-2xl border ${style.bg} ${style.border}`}>
                                <div className="flex gap-3">
                                    <span className={`material-symbols-outlined ${style.icon}`}>{style.iconName}</span>
                                    <div>
                                        <p className={`text-sm font-bold ${style.title}`}>{t(alert.title)}</p>
                                        <p className={`text-xs ${style.text} mt-0.5`}>{t(alert.message)}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
