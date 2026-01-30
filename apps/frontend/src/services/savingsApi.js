import { api } from '../lib/api-client';

export const savingsApi = {
    getGoals: async () => {
        const response = await api.get('/savings');
        return response;
    },
    createGoal: async (data) => {
        const response = await api.post('/savings', data);
        return response;
    },
    updateGoal: async (id, data) => {
        const response = await api.patch(`/savings/${id}`, data);
        return response;
    },
    deleteGoal: async (id) => {
        const response = await api.delete(`/savings/${id}`);
        return response;
    }
};
