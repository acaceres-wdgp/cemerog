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

// Doctor prop shared by HandleInertiaRequests when the user has a linked doctor
export interface DoctorProp {
    id: number;
    name: string;
    office: string;
}

// Queue optional prop resolved on partial reloads (only for users with a doctor)
export interface QueueProp {
    current_turn: {
        id: number;
        turn_number: number;
        patient_name: string;
    } | null;
    waiting_count: number;
}

// Convenience type for page components
export interface PageProps {
    auth: Auth;
    permissions: string[];
    name: string;
    sidebarOpen: boolean;
    doctor?: DoctorProp | null;
    queue?: QueueProp | null;
    [key: string]: unknown;
}
