import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useBudgets } from '../hooks/useBudgets';
import { usePreferences } from '../context/PreferencesContext';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const queryClient = useQueryClient();
    const { formatCurrency } = usePreferences();

    // Fetch budgets for local alerts
    const { data: budgets } = useBudgets();

    // Generate budget alerts locally
    const budgetAlerts = useMemo(() => {
        if (!budgets || !Array.isArray(budgets)) return [];

        const alerts = [];
        const seenCategories = new Set();

        for (const budget of budgets) {
            const categoryName = budget.category?.name || budget.name || 'Unknown';
            if (seenCategories.has(categoryName.toLowerCase())) continue;
            seenCategories.add(categoryName.toLowerCase());

            const spent = parseFloat(budget.spent || 0);
            const limit = parseFloat(budget.limit || budget.amount || 0);
            const percent = limit > 0 ? (spent / limit) * 100 : 0;

            if (percent > 100) {
                alerts.push({
                    id: `budget-exceeded-${budget.id}`,
                    type: 'error',
                    title: `Budget Exceeded: ${categoryName}`,
                    message: `You've spent ${formatCurrency(spent)} of ${formatCurrency(limit)} (${Math.round(percent)}%). Over by ${formatCurrency(spent - limit)}.`,
                    createdAt: new Date().toISOString(),
                    isRead: false,
                    isBudgetAlert: true
                });
            } else if (percent >= 80) {
                alerts.push({
                    id: `budget-warning-${budget.id}`,
                    type: 'warning',
                    title: `Budget Warning: ${categoryName}`,
                    message: `You've used ${Math.round(percent)}% of your ${formatCurrency(limit)} budget. Only ${formatCurrency(limit - spent)} remaining.`,
                    createdAt: new Date().toISOString(),
                    isRead: false,
                    isBudgetAlert: true
                });
            }
        }
        return alerts;
    }, [budgets, formatCurrency]);

    // Fetch unread count
    const { data: unreadData } = useQuery({
        queryKey: ['notifications', 'unread'],
        queryFn: async () => {
            try {
                const res = await api.get('/notifications/unread-count');
                return res.data ?? { count: 0 };
            } catch (err) {
                console.log('[Notifications] Unread count fetch failed');
                return { count: 0 };
            }
        },
        refetchInterval: 30000,
        retry: false,
        staleTime: 10000,
    });

    // Fetch notifications list
    const { data: notifications, isLoading, refetch } = useQuery({
        queryKey: ['notifications', 'list'],
        queryFn: async () => {
            try {
                const res = await api.get('/notifications');
                return Array.isArray(res.data) ? res.data : [];
            } catch (err) {
                console.log('[Notifications] List fetch failed');
                return [];
            }
        },
        enabled: isOpen,
        retry: false,
        staleTime: 10000,
    });

    // Mutations
    const markReadMutation = useMutation({
        mutationFn: (id) => api.patch(`/notifications/${id}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => api.patch('/notifications/read-all'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) refetch();
    };

    const handleMarkRead = (id, isRead) => {
        if (!isRead) markReadMutation.mutate(id);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return 'check_circle';
            case 'warning': return 'warning';
            case 'error': return 'error';
            default: return 'notifications';
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'success': return 'text-emerald-500 dark:text-emerald-400';
            case 'warning': return 'text-amber-500 dark:text-amber-400';
            case 'error': return 'text-rose-500 dark:text-rose-400';
            default: return 'text-blue-500 dark:text-blue-400';
        }
    };

    // Combine budget alerts with API notifications
    const allNotifications = useMemo(() => {
        const apiNotifs = Array.isArray(notifications) ? notifications : [];
        return [...budgetAlerts, ...apiNotifs];
    }, [budgetAlerts, notifications]);

    const totalUnread = (unreadData?.count || 0) + budgetAlerts.length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="relative p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors border border-slate-200 dark:border-white/5 cursor-pointer outline-none focus:ring-1 focus:ring-emerald-500/50 shadow-sm"
            >
                <span className="material-symbols-outlined">notifications</span>
                {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-rose-500 rounded-full text-[10px] font-bold text-white px-1">
                        {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    {/* Mobile Backdrop */}
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 md:hidden" onClick={() => setIsOpen(false)}></div>

                    {/* Dropdown / Modal */}
                    <div className="fixed left-4 right-4 top-[15%] md:absolute md:left-auto md:right-0 md:top-full md:w-96 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl md:shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 md:mt-2">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5">
                            <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                            {unreadData?.count > 0 && (
                                <button
                                    onClick={() => markAllReadMutation.mutate()}
                                    className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {isLoading && budgetAlerts.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                    <span className="material-symbols-outlined animate-spin text-2xl mb-2">progress_activity</span>
                                    <p className="text-sm">Loading...</p>
                                </div>
                            ) : allNotifications && allNotifications.length > 0 ? (
                                allNotifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => !notif.isBudgetAlert && handleMarkRead(notif.id, notif.isRead)}
                                        className={`p-4 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex gap-4 ${!notif.isRead ? 'bg-emerald-50/50 dark:bg-white/[0.02]' : ''} ${notif.isBudgetAlert ? 'border-l-2 border-l-rose-500' : ''}`}
                                    >
                                        <div className={`mt-0.5 ${getColor(notif.type)}`}>
                                            <span className="material-symbols-outlined text-[20px]">{getIcon(notif.type)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm mb-0.5 line-clamp-2 ${!notif.isRead ? 'font-semibold text-slate-900 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-slate-500 line-clamp-2 mb-1.5">{notif.message}</p>
                                            <div className="flex items-center gap-2">
                                                {notif.isBudgetAlert && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium">Budget Alert</span>
                                                )}
                                                <span className="text-[10px] text-slate-500">
                                                    {new Date(notif.createdAt).toLocaleDateString()} • {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        {!notif.isRead && (
                                            <div className="self-center">
                                                <span className="block size-2 rounded-full bg-emerald-500"></span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-slate-500">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">notifications_off</span>
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
