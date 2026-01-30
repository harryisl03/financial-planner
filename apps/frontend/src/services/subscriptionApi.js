import { api } from '../lib/api-client';

export const subscriptionApi = {
    getCurrentSubscription: () => api.get('/subscriptions/current'),

    upgradeSubscription: (plan) => api.post('/subscriptions/upgrade', { plan }),

    downgradeSubscription: () => api.post('/subscriptions/downgrade', {}),

    cancelSubscription: () => api.post('/subscriptions/cancel', {}),

    getInvoices: () => api.get('/subscriptions/invoices'),
};
