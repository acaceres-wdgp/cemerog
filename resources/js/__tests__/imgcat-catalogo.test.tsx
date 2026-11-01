import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost, mockPut } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    mockPut: vi.fn(),
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: { post: mockPost, put: mockPut, get: vi.fn() },
    usePage: () => ({ props: { errors: {} } }),
}));

import ImgcatIndex from '@/pages/imgcat/index';
import type { ImagingStudyRow } from '@/pages/imgcat/types';

const modalities = [
    'Radiografía',
    'Sonografía',
    'Tomografía',
    'Mamografía',
    'Otro',
];
const studies: ImagingStudyRow[] = [
    {
        id: 1,
        code: 'I-01',
        name: 'Radiografía de tórax PA',
        modality: 'Radiografía',
        preparation: 'Retirar objetos metálicos del tórax.',
        price: 80000,
        is_active: true,
    },
    {
        id: 2,
        code: 'I-02',
        name: 'Sonografía abdominal',
        modality: 'Sonografía',
        preparation: 'Ayuno de 6 horas.',
        price: 150000,
        is_active: true,
    },
];

const renderPage = () =>
    render(
        <ImgcatIndex
            studies={studies}
            modalities={modalities}
            next_code="I-03"
        />,
    );

beforeEach(() => {
    mockPost.mockReset();
    mockPut.mockReset();
});

describe('Catálogo de imágenes', () => {
    it('lists the studies and filters by the modalities in use', () => {
        renderPage();

        expect(screen.getByText('Radiografía de tórax PA')).toBeTruthy();
        expect(screen.getByText('RD$1,500.00')).toBeTruthy();
        expect(screen.queryByRole('tab', { name: /Tomografía/ })).toBeNull();

        fireEvent.click(screen.getByRole('tab', { name: /Sonografía/ }));
        expect(screen.queryByText('Radiografía de tórax PA')).toBeNull();
        expect(screen.getByText('Sonografía abdominal')).toBeTruthy();
    });

    it('creates a study with the suggested code and the price in centavos', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /Nuevo estudio/ }));

        const dialog = screen.getByRole('dialog');
        expect(
            (within(dialog).getByLabelText(/Código/) as HTMLInputElement).value,
        ).toBe('I-03');
        fireEvent.change(within(dialog).getByLabelText(/^Estudio/), {
            target: { value: 'Tomografía de cráneo' },
        });
        fireEvent.change(within(dialog).getByLabelText(/Modalidad/), {
            target: { value: 'Tomografía' },
        });
        fireEvent.change(within(dialog).getByLabelText(/Precio/), {
            target: { value: '4,500' },
        });
        fireEvent.click(
            within(dialog).getByRole('button', {
                name: /Agregar al catálogo/,
            }),
        );

        expect(mockPost).toHaveBeenCalledWith(
            '/admin/imagenes-catalogo',
            {
                code: 'I-03',
                name: 'Tomografía de cráneo',
                modality: 'Tomografía',
                preparation: null,
                price: 450000,
            },
            expect.anything(),
        );
    });

    it('edits and deactivates a study', () => {
        renderPage();
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Editar Sonografía abdominal',
            }),
        );

        const dialog = screen.getByRole('dialog');
        fireEvent.click(within(dialog).getByLabelText(/Activo/));
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Guardar' }),
        );

        expect(mockPut).toHaveBeenCalledWith(
            '/admin/imagenes-catalogo/2',
            expect.objectContaining({ price: 150000, is_active: false }),
            expect.anything(),
        );
    });
});
