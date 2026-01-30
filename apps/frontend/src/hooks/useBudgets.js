import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetApi } from '../services/budgetApi';

export const budgetKeys = {
    all: ['budgets'],
    list: () => [...budgetKeys.all, 'list'],
    overview: () => [...budgetKeys.all, 'overview'],
};

export function useBudgets() {
    return useQuery({
        queryKey: budgetKeys.list(),
        queryFn: () => budgetApi.getBudgets(),
    });
}

export function useBudgetOverview() {
    return useQuery({
        queryKey: budgetKeys.overview(),
        queryFn: () => budgetApi.getBudgetOverview(),
    });
}

export function useCreateBudget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => budgetApi.createBudget(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: budgetKeys.all });
        },
    });
}

export function useUpdateBudget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => budgetApi.updateBudget(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: budgetKeys.all });
        },
    });
}

export function useDeleteBudget() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => budgetApi.deleteBudget(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: budgetKeys.all });
        },
    });
}
