import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '../services/alertsApi';

export const alertsKeys = {
    all: ['alerts'],
    list: () => [...alertsKeys.all, 'list'],
};

export function useAlerts() {
    return useQuery({
        queryKey: alertsKeys.list(),
        queryFn: () => alertsApi.getAlerts(),
    });
}
