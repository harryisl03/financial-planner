import { api } from '../lib/api-client';

export const accountApi = {
    getAccounts: () => api.get('/accounts'),

    getAccountById: (id) => api.get(`/accounts/${id}`),

    getTotalBalance: () => api.get('/accounts/total-balance'),

    createAccount: (data) => api.post('/accounts', data),

    updateAccount: (id, data) => api.patch(`/accounts/${id}`, data),

    deleteAccount: (id) => api.delete(`/accounts/${id}`),
};
