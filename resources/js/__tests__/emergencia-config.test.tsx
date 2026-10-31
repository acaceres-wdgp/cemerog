/**
 * Administración › Emergencia and Inventario › Catálogo.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost, mockPut, page } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    mockPut: vi.fn(),
    page: { props: { errors: {} as Record<string, string> } },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: { post: mockPost, put: mockPut, get: vi.fn() },
    usePage: () => page,
}));

import AdminEmergencia from '@/pages/admin-emergencia/index';
import AlmacenIndex from '@/pages/almacen/index';
import type { InventoryItemRow } from '@/pages/almacen/types';

beforeEach(() => {
    mockPost.mockClear();
    mockPut.mockClear();
});

describe('Administración › Emergencia', () => {
    const cubicles = [
        { id: 1, name: 'Cub. 1', is_active: true },
        { id: 2, name: 'Observación', is_active: false },
    ];

    it('changes the emergency fee in centavos', () => {
        render(<AdminEmergencia cubicles={cubicles} emergency_fee={150000} />);

        fireEvent.change(screen.getByLabelText(/Cargo por emergencia/), {
            target: { value: '1800' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
        expect(mockPut).toHaveBeenCalledWith(
            '/admin/emergencia/cargo',
            { emergency_fee: 180000 },
            expect.anything(),
        );
    });

    it('adds a cubicle', () => {
        render(<AdminEmergencia cubicles={cubicles} emergency_fee={150000} />);
        expect(screen.getByText('Inactivo')).toBeTruthy();

        fireEvent.click(
            screen.getByRole('button', { name: 'Agregar cubículo' }),
        );
        const dialog = screen.getByRole('dialog');
        fireEvent.change(within(dialog).getByLabelText(/Nombre/), {
            target: { value: 'Cub. 7' },
        });
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Agregar cubículo' }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/admin/emergencia/cubiculos',
            { name: 'Cub. 7' },
            expect.anything(),
        );
    });

    it('renames or deactivates a cubicle', () => {
        render(<AdminEmergencia cubicles={cubicles} emergency_fee={150000} />);

        fireEvent.click(screen.getByRole('button', { name: 'Editar Cub. 1' }));
        const dialog = screen.getByRole('dialog');
        fireEvent.click(within(dialog).getByLabelText(/Activo/));
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Guardar' }),
        );
        expect(mockPut).toHaveBeenCalledWith(
            '/admin/emergencia/cubiculos/1',
            { name: 'Cub. 1', is_active: false },
            expect.anything(),
        );
    });
});

describe('Inventario › Catálogo', () => {
    const items: InventoryItemRow[] = [
        {
            id: 1,
            code: 'MED-001',
            name: 'Dipirona 1 g/2 ml',
            presentation: 'Ampolla',
            kind: 'medicamento',
            price: 15000,
            stock: 3,
            min_stock: 10,
            is_active: true,
            low_stock: true,
        },
        {
            id: 2,
            code: 'INS-001',
            name: 'Gasa estéril',
            presentation: null,
            kind: 'insumo',
            price: 2500,
            stock: 80,
            min_stock: 10,
            is_active: true,
            low_stock: false,
        },
    ];

    it('filters by kind and search, and flags low stock', () => {
        render(<AlmacenIndex items={items} can_edit={false} />);

        expect(screen.getByText('Existencia baja')).toBeTruthy();
        expect(
            screen.queryByRole('button', { name: 'Nuevo artículo' }),
        ).toBeNull();

        fireEvent.click(screen.getByRole('tab', { name: /Insumos/ }));
        expect(screen.queryByText('Dipirona 1 g/2 ml')).toBeNull();
        expect(screen.getByText('Gasa estéril')).toBeTruthy();

        fireEvent.click(screen.getByRole('tab', { name: /Todos/ }));
        fireEvent.change(screen.getByLabelText('Buscar por nombre o código'), {
            target: { value: 'med-001' },
        });
        expect(screen.getByText('Dipirona 1 g/2 ml')).toBeTruthy();
        expect(screen.queryByText('Gasa estéril')).toBeNull();
    });

    it('an administrator adds an item with its price in centavos', () => {
        render(<AlmacenIndex items={items} can_edit />);

        fireEvent.click(screen.getByRole('button', { name: 'Nuevo artículo' }));
        const dialog = screen.getByRole('dialog');
        fireEvent.click(within(dialog).getByRole('tab', { name: 'Insumo' }));
        fireEvent.change(within(dialog).getByLabelText(/Nombre/), {
            target: { value: 'Algodón' },
        });
        fireEvent.change(within(dialog).getByLabelText(/Precio/), {
            target: { value: '35' },
        });
        fireEvent.change(within(dialog).getByLabelText(/Existencia/), {
            target: { value: '50' },
        });
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Agregar al catálogo' }),
        );

        expect(mockPost).toHaveBeenCalledWith(
            '/almacen/articulos',
            {
                name: 'Algodón',
                presentation: null,
                kind: 'insumo',
                price: 3500,
                stock: 50,
                min_stock: 0,
            },
            expect.anything(),
        );
    });
});
