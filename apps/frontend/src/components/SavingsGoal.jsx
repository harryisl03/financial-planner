import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../context/PreferencesContext';

export default function SavingsGoal({ goal, onAddContribution, onEdit, onDelete }) {
    const { t } = usePreferences();
    const navigate = useNavigate();

    // If no goal exists, show empty state
    if (!goal) {
        return (
            <div className="glass-card rounded-3xl p-6 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 h-full flex flex-col items-center justify-center text-center">
                <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
                    <span className="material-symbols-outlined text-3xl">savings</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('No Savings Goal')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('Set a target to start saving.')}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('Set a target to start saving.')}</p>
            </div>
        );
    }

    const target = Number(goal.targetAmount) || 0;
    const current = Number(goal.currentAmount) || 0;
    const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
    const color = goal.color || 'emerald';

    // Calculate stroke dash based on 2 * PI * radius (r=40 -> ~251.2)
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Gradient colors map
    const gradients = {
        emerald: { start: '#10B981', end: '#06B6D4', text: 'text-emerald-500' },
        blue: { start: '#3B82F6', end: '#6366F1', text: 'text-blue-500' },
        rose: { start: '#F43F5E', end: '#FB923C', text: 'text-rose-500' },
        amber: { start: '#F59E0B', end: '#F43F5E', text: 'text-amber-500' },
    };

    const theme = gradients[color] || gradients.emerald;

    return (
        <div className="glass-card rounded-3xl p-6 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold bg-gradient-to-r from-[${theme.start}] to-[${theme.end}] bg-clip-text text-transparent`}>
                    {goal.name}
                </h3>
                <div className="flex items-center gap-1">
                    {onEdit && (
                        <button onClick={() => onEdit(goal)} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                    )}
                    {onDelete && (
                        <button onClick={() => onDelete(goal.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-center py-4">
                <div className="relative size-40 mb-6">
                    <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                        {/* Background Circle */}
                        <circle
                            cx="50"
                            cy="50"
                            fill="transparent"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-slate-100 dark:text-slate-800"
                        />
                        {/* Progress Circle with Gradient */}
                        <circle
                            cx="50"
                            cy="50"
                            fill="transparent"
                            r={radius}
                            stroke={`url(#gradient-${color})`}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            strokeWidth="8"
                            className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                            <linearGradient id={`gradient-${color}`} x1="0%" x2="100%" y1="0%" y2="0%">
                                <stop offset="0%" stopColor={theme.start} />
                                <stop offset="100%" stopColor={theme.end} />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{percentage}%</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-tighter">{t('Completed')}</span>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('Target')}: {target.toLocaleString()}</p>
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white">${current.toLocaleString()}</p>
                </div>
            </div>

            <button
                onClick={onAddContribution}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-sm transition-colors mt-4"
            >
                {t('Add Contribution')}
            </button>
        </div>
    );
}
