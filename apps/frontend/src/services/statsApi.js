import { api } from '../lib/api-client';

export const statsApi = {
    getSummary: (period = 'month') => api.get(`/stats/summary?period=${period}`),

    getSpendingByCategory: (period = 'month') => api.get(`/stats/by-category?period=${period}`),

    getTrends: (period = 'month') => api.get(`/stats/trends?period=${period}`),

    getBalanceHistory: (period = 'month') => api.get(`/stats/balance-history?period=${period}`),
};
