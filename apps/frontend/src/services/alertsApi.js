import { api } from '../lib/api-client';

export const alertsApi = {
    getAlerts: async () => {
        const response = await api.get('/alerts');
        return response;
    }
};
