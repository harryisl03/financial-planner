import { api } from '../lib/api-client';

export const categoryApi = {
    getCategories: () => api.get('/categories'),

    createCategory: (data) => api.post('/categories', data),

    updateCategory: (id, data) => api.patch(`/categories/${id}`, data),

    deleteCategory: (id) => api.delete(`/categories/${id}`),
};
