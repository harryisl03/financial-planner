import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsApi } from '../services/savingsApi';

export const savingsKeys = {
    all: ['savings'],
    list: () => [...savingsKeys.all, 'list'],
};

export function useSavings() {
    return useQuery({
        queryKey: savingsKeys.list(),
        queryFn: () => savingsApi.getGoals(),
    });
}

export function useCreateSavingsGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => savingsApi.createGoal(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: savingsKeys.all });
        },
    });
}

export function useUpdateSavingsGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => savingsApi.updateGoal(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: savingsKeys.all });
        },
    });
}

export function useDeleteSavingsGoal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => savingsApi.deleteGoal(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: savingsKeys.all });
        },
    });
}
