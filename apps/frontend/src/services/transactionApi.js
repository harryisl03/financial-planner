import { api } from '../lib/api-client';

export const transactionApi = {
    getTransactions: (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, value);
            }
        });
        const queryString = params.toString();
        return api.get(`/transactions${queryString ? `?${queryString}` : ''}`);
    },

    getTransactionById: (id) => api.get(`/transactions/${id}`),

    createTransaction: (data) => api.post('/transactions', data),

    updateTransaction: (id, data) => api.patch(`/transactions/${id}`, data),

    deleteTransaction: (id) => api.delete(`/transactions/${id}`),
};
