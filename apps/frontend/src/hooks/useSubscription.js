import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '../services/subscriptionApi';

export const subscriptionKeys = {
    all: ['subscription'],
    current: () => [...subscriptionKeys.all, 'current'],
    invoices: () => [...subscriptionKeys.all, 'invoices'],
    plans: () => [...subscriptionKeys.all, 'plans'],
};

export function useCurrentSubscription() {
    return useQuery({
        queryKey: subscriptionKeys.current(),
        queryFn: () => subscriptionApi.getCurrentSubscription(),
    });
}

export function useInvoices() {
    return useQuery({
        queryKey: subscriptionKeys.invoices(),
        queryFn: () => subscriptionApi.getInvoices(),
    });
}

export function usePlans() {
    return useQuery({
        queryKey: subscriptionKeys.plans(),
        queryFn: async () => {
            // Return default plans since backend may not have this endpoint yet
            return [
                { id: 'free', name: 'Basic', price: 0, description: 'For casual tracking', features: ['5 Wallets', 'Basic Analytics', 'Manual Sync'] },
                { id: 'pro', name: 'Pro', price: 29, description: 'For serious budgeters', features: ['Unlimited Wallets', 'Advanced Analytics', 'Auto-Bank Sync', 'Export to CSV'] },
                { id: 'enterprise', name: 'Enterprise', price: 99, description: 'For families & small biz', features: ['Everything in Pro', 'Priority Support', 'Multiple Users', 'Custom API Access'] }
            ];
        },
    });
}

export function useUpgradeSubscription() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (plan) => subscriptionApi.upgradeSubscription(plan),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
        },
    });
}

export function useDowngradeSubscription() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (plan) => subscriptionApi.downgradeSubscription(plan),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
        },
    });
}

export function useCancelSubscription() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => subscriptionApi.cancelSubscription(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
        },
    });
}

// Alias exports for convenience
export { useCurrentSubscription as useSubscription };
export { useInvoices as useBillingHistory };
