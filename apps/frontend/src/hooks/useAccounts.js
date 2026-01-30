import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountApi } from '../services/accountApi';

export const accountKeys = {
    all: ['accounts'],
    lists: () => [...accountKeys.all, 'list'],
    list: (filters) => [...accountKeys.lists(), filters],
    details: () => [...accountKeys.all, 'detail'],
    detail: (id) => [...accountKeys.details(), id],
    totalBalance: () => [...accountKeys.all, 'totalBalance'],
};

export function useAccounts() {
    return useQuery({
        queryKey: accountKeys.lists(),
        queryFn: () => accountApi.getAccounts(),
    });
}

export function useAccount(id) {
    return useQuery({
        queryKey: accountKeys.detail(id),
        queryFn: () => accountApi.getAccountById(id),
        enabled: !!id,
    });
}

export function useTotalBalance() {
    return useQuery({
        queryKey: accountKeys.totalBalance(),
        queryFn: () => accountApi.getTotalBalance(),
    });
}

export function useCreateAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => accountApi.createAccount(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accountKeys.all });
        },
    });
}

export function useUpdateAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => accountApi.updateAccount(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: accountKeys.all });
        },
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => accountApi.deleteAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accountKeys.all });
        },
    });
}
