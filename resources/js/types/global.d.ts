import type { Auth } from '@/types/auth';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            permissions: string[];
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}

// Convenience type for page components
export interface PageProps {
    auth: Auth;
    permissions: string[];
    name: string;
    sidebarOpen: boolean;
    [key: string]: unknown;
}
