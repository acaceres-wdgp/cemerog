import { usePage } from '@inertiajs/react';

export type CanFn = (permission: string) => boolean;

/**
 * Check the current user's permissions shared by HandleInertiaRequests.
 */
export function useCan(): CanFn {
    const { permissions } = usePage().props;

    return (permission) => permissions.includes(permission);
}
