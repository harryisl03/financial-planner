import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '../services/transactionApi';

export const transactionKeys = {
    all: ['transactions'],
    lists: () => [...transactionKeys.all, 'list'],
    list: (filters) => [...transactionKeys.lists(), filters],
    details: () => [...transactionKeys.all, 'detail'],
    detail: (id) => [...transactionKeys.details(), id],
};

export function useTransactions(filters = {}) {
    return useQuery({
        queryKey: transactionKeys.list(filters),
        queryFn: () => transactionApi.getTransactions(filters),
    });
}

export function useTransaction(id) {
    return useQuery({
        queryKey: transactionKeys.detail(id),
        queryFn: () => transactionApi.getTransactionById(id),
        enabled: !!id,
    });
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => transactionApi.createTransaction(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            // Also invalidate accounts since balance might change
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            // Invalidate stats since they depend on transactions
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
    });
}

export function useUpdateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => transactionApi.updateTransaction(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => transactionApi.deleteTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: transactionKeys.all });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
    });
}
