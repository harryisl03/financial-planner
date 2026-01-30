import { api } from '../lib/api-client';

export const userApi = {
    getCurrentUser: () => api.get('/users/me'),

    updateProfile: (data) => api.patch('/users/me', data),

    getPreferences: () => api.get('/users/me/preferences'),

    updatePreferences: (data) => api.patch('/users/me/preferences', data),
};
