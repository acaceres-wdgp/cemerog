/**
 * Verifica que el initial state de useForm en RegistroIndex
 * no incluya el campo `open_turn`, que es solo para errores del servidor
 * y no debe enviarse en el payload de la petición.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Captura el initial data pasado a useForm
let capturedInitialData: Record<string, unknown> | null = null;

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
    useForm: (initial: Record<string, unknown>) => {
        capturedInitialData = initial;
        return {
            data: initial,
            setData: vi.fn(),
            post: vi.fn(),
            processing: false,
            errors: {},
            reset: vi.fn(),
        };
    },
    usePage: () => ({
        props: {
            auth: {
                user: { name: 'Test', permissions: ['module.registro.access'] },
            },
        },
    }),
    router: { get: vi.fn() },
}));

vi.mock('@/routes', () => ({
    registro: { index: () => '/registro' },
    pacientes: { index: () => '/pacientes', url: () => '/pacientes' },
}));
vi.mock('@/routes/registro/pacientes', () => ({
    search: () => '/registro/pacientes/buscar',
}));

import RegistroIndex from '@/pages/registro/index';

const BASE_PROPS = {
    doctors: [{ id: 1, name: 'Dr. Test', specialty: 'General' }],
    patient: null,
};

describe('registro - useForm initial data', () => {
    it('no incluye open_turn en los datos del formulario', () => {
        capturedInitialData = null;
        render(<RegistroIndex {...BASE_PROPS} />);

        expect(capturedInitialData).not.toBeNull();
        expect(Object.keys(capturedInitialData!)).not.toContain('open_turn');
    });
});
