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

import AnalisisIndex from '@/pages/analisis/index';
import type { LabTestRow } from '@/pages/analisis/types';

const categories = ['Hematología', 'Química', 'Serología', 'Uroanálisis'];
const tests: LabTestRow[] = [
    {
        id: 1,
        code: '130',
        name: 'Glucosa en ayunas',
        category: 'Química',
        preparation: 'Ayuno de 8 horas.',
        price: 25000,
        is_active: true,
        parameters: [
            {
                name: 'Glucosa',
                result_type: 'numerico',
                unit: 'mg/dL',
                min: 70,
                max: 100,
                normal_text: null,
                reference: '70 – 100 mg/dL',
            },
        ],
    },
    {
        id: 2,
        code: '109',
        name: 'Gestatest',
        category: 'Serología',
        preparation: null,
        price: 30000,
        is_active: true,
        parameters: [
            {
                name: 'Gestatest',
                result_type: 'texto',
                unit: null,
                min: null,
                max: null,
                normal_text: 'NEGATIVO',
                reference: 'NEGATIVO',
            },
        ],
    },
];

describe('Catálogo de análisis', () => {
    beforeEach(() => {
        mockPost.mockClear();
        mockPut.mockClear();
    });

    it('filters by category and search', () => {
        render(<AnalisisIndex tests={tests} categories={categories} />);

        expect(screen.getByText('70 – 100 mg/dL')).toBeTruthy();
        fireEvent.click(screen.getByRole('tab', { name: /Serología/ }));
        expect(screen.queryByText('Glucosa en ayunas')).toBeNull();
        fireEvent.click(screen.getByRole('tab', { name: /Todas/ }));
        fireEvent.change(screen.getByLabelText('Buscar análisis o código'), {
            target: { value: '130' },
        });
        expect(screen.queryByText('Gestatest')).toBeNull();
    });

    it('creates an analysis with a numeric and a text parameter', () => {
        render(<AnalisisIndex tests={tests} categories={categories} />);

        fireEvent.click(screen.getByRole('button', { name: 'Nuevo análisis' }));
        const dialog = screen.getByRole('dialog');
        fireEvent.change(within(dialog).getByLabelText(/Código/), {
            target: { value: '131' },
        });
        fireEvent.change(within(dialog).getByLabelText(/^Análisis/), {
            target: { value: 'Creatinina' },
        });
        fireEvent.change(within(dialog).getByLabelText(/Precio/), {
            target: { value: '300' },
        });
        fireEvent.change(within(dialog).getByLabelText('Parámetro 1'), {
            target: { value: 'Creatinina' },
        });
        fireEvent.change(
            within(dialog).getByLabelText('Mínimo del parámetro 1'),
            { target: { value: '0.7' } },
        );
        fireEvent.change(
            within(dialog).getByLabelText('Máximo del parámetro 1'),
            { target: { value: '1,3' } },
        );
        fireEvent.change(
            within(dialog).getByLabelText('Unidad del parámetro 1'),
            { target: { value: 'mg/dL' } },
        );
        fireEvent.click(
            within(dialog).getByRole('button', { name: /Agregar parámetro/ }),
        );
        fireEvent.change(within(dialog).getByLabelText('Parámetro 2'), {
            target: { value: 'Observación' },
        });
        fireEvent.change(
            within(dialog).getByLabelText('Tipo del parámetro 2'),
            { target: { value: 'texto' } },
        );
        fireEvent.change(
            within(dialog).getByLabelText('Valor normal del parámetro 2'),
            { target: { value: 'Normal' } },
        );
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Agregar al catálogo' }),
        );

        expect(mockPost).toHaveBeenCalledWith(
            '/admin/analisis',
            {
                code: '131',
                name: 'Creatinina',
                category: 'Hematología',
                preparation: null,
                price: 30000,
                parameters: [
                    {
                        name: 'Creatinina',
                        result_type: 'numerico',
                        unit: 'mg/dL',
                        min: 0.7,
                        max: 1.3,
                    },
                    {
                        name: 'Observación',
                        result_type: 'texto',
                        normal_text: 'Normal',
                    },
                ],
            },
            expect.anything(),
        );
    });

    it('edits an analysis and can deactivate it', () => {
        render(<AnalisisIndex tests={tests} categories={categories} />);

        fireEvent.click(
            screen.getByRole('button', { name: 'Editar Gestatest' }),
        );
        const dialog = screen.getByRole('dialog');
        expect(
            within(dialog).getByLabelText('Valor normal del parámetro 1'),
        ).toHaveValue('NEGATIVO');
        fireEvent.click(within(dialog).getByLabelText(/Activo/));
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Guardar' }),
        );

        expect(mockPut).toHaveBeenCalledWith(
            '/admin/analisis/2',
            expect.objectContaining({ is_active: false }),
            expect.anything(),
        );
    });
});
