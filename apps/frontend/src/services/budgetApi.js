import { api } from '../lib/api-client';

export const budgetApi = {
    getBudgets: () => api.get('/budgets'),

    getBudgetOverview: () => api.get('/budgets/overview'),

    createBudget: (data) => api.post('/budgets', data),

    updateBudget: (id, data) => api.patch(`/budgets/${id}`, data),

    deleteBudget: (id) => api.delete(`/budgets/${id}`),
};
