import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../services/statsApi';

export const statsKeys = {
    all: ['stats'],
    summary: (period) => [...statsKeys.all, 'summary', period],
    byCategory: (period) => [...statsKeys.all, 'byCategory', period],
    trends: (period) => [...statsKeys.all, 'trends', period],
    balanceHistory: (period) => [...statsKeys.all, 'balanceHistory', period],
};

export function useSummary(period = 'month') {
    return useQuery({
        queryKey: statsKeys.summary(period),
        queryFn: () => statsApi.getSummary(period),
    });
}

export function useSpendingByCategory(period = 'month') {
    return useQuery({
        queryKey: statsKeys.byCategory(period),
        queryFn: () => statsApi.getSpendingByCategory(period),
    });
}

export function useTrends(period = 'month') {
    return useQuery({
        queryKey: statsKeys.trends(period),
        queryFn: () => statsApi.getTrends(period),
    });
}

export function useBalanceHistory(period = 'month') {
    return useQuery({
        queryKey: statsKeys.balanceHistory(period),
        queryFn: () => statsApi.getBalanceHistory(period),
    });
}

