import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../services/userApi';

export const userKeys = {
    all: ['user'],
    current: () => [...userKeys.all, 'current'],
    preferences: () => [...userKeys.all, 'preferences'],
};

export function useCurrentUser() {
    return useQuery({
        queryKey: userKeys.current(),
        queryFn: () => userApi.getCurrentUser(),
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => userApi.updateProfile(data),
        onSuccess: async () => {
            // Invalidate and refetch all user-related queries
            await queryClient.invalidateQueries({ queryKey: userKeys.all });
            // Force immediate refetch of current user
            await queryClient.refetchQueries({ queryKey: userKeys.current() });
        },
    });
}

export function useUserPreferences(enabled = true) {
    return useQuery({
        queryKey: userKeys.preferences(),
        queryFn: () => userApi.getPreferences(),
        enabled: enabled,
        retry: false,
    });
}

export function useUpdatePreferences() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => userApi.updatePreferences(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.preferences() });
        },
        onError: (error) => {
            console.error('Failed to update preferences:', error);
            console.error('Error details:', error.response?.data);
        },
    });
}

// Alias export for convenience
export { useCurrentUser as useUser };
