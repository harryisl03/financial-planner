import { api } from '../lib/api-client';

export const billsApi = {
    getAll: () => api.get('/bills'),
    create: (data) => api.post('/bills', data),
    update: (id, data) => api.patch(`/bills/${id}`, data),
    delete: (id) => api.delete(`/bills/${id}`),
};
