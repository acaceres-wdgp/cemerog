import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Pages only: test files under pages/ must not end up in the build
const pages = import.meta.glob([
    './pages/**/*.tsx',
    '!./pages/**/__tests__/**',
    '!./pages/**/*.test.tsx',
]);

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: (name) =>
        resolvePageComponent(`./pages/${name}.tsx`, pages) as any,
    layout: (name) => {
        switch (true) {
            case name.startsWith('auth/'):
                return AuthLayout;
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
