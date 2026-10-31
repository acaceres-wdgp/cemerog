/**
 * Inventario: catálogo (tarjetas, vencimiento, ajuste), entrada de mercancía
 * y proveedores.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost, mockPut, page } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    mockPut: vi.fn(),
    page: {
        props: { errors: {} as Record<string, string> },
        flash: {} as Record<string, unknown>,
    },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: { post: mockPost, put: mockPut, get: vi.fn() },
    usePage: () => page,
}));

import AlmacenIndex from '@/pages/almacen/index';
import Proveedores from '@/pages/almacen/proveedores';
import { expiryLabel } from '@/pages/almacen/types';
import type { InventoryItemRow } from '@/pages/almacen/types';
import EntradaIndex from '@/pages/entrada/index';

const item = (o: Partial<InventoryItemRow>): InventoryItemRow => ({
    id: 1,
    code: 'MED-001',
    name: 'Dipirona',
    presentation: '1 g/2 ml · ampolla',
    kind: 'medicamento',
    price: 15000,
    cost: 6200,
    stock: 141,
    min_stock: 50,
    is_active: true,
    low_stock: false,
    lot: 'L2307',
    expires_on: '08/2027',
    expires_soon: false,
    suppliers: [
        {
            name: 'Distribuidora del Cibao',
            last_cost: 6200,
            last_entry_on: '24/10/2026',
        },
    ],
    ...o,
});

const catalog = [
    item({}),
    item({
        id: 2,
        code: 'MED-002',
        name: 'Omeprazol',
        stock: 9,
        min_stock: 15,
        low_stock: true,
        expires_soon: true,
        expires_on: '12/2026',
    }),
    item({
        id: 3,
        code: 'INS-001',
        name: 'Gasa estéril',
        kind: 'insumo',
        cost: null,
        lot: null,
        expires_on: null,
        suppliers: [],
    }),
];

beforeEach(() => {
    mockPost.mockClear();
    mockPut.mockClear();
    page.flash = {};
});

describe('Catálogo', () => {
    it('cards filter low stock and expiring items; the table shows cost and lot', () => {
        render(
            <AlmacenIndex
                items={catalog}
                can_edit
                adjustment_reasons={{ conteo: 'Conteo físico' }}
            />,
        );

        expect(screen.getAllByText('L2307').length).toBeGreaterThan(0);
        expect(screen.getAllByText('RD$62.00').length).toBeGreaterThan(0);

        fireEvent.click(screen.getByRole('button', { name: /Bajo el mínimo/ }));
        expect(screen.queryByText('Dipirona')).toBeNull();
        expect(screen.getByText('Omeprazol')).toBeTruthy();
        expect(screen.getByText('Bajo mínimo')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: /Bajo el mínimo/ }));
        fireEvent.click(
            screen.getByRole('button', { name: /Vencen en 90 días/ }),
        );
        expect(screen.getAllByRole('row')).toHaveLength(2);
    });

    it('adjusts the stock after a physical count', () => {
        render(
            <AlmacenIndex
                items={catalog}
                can_edit
                adjustment_reasons={{
                    conteo: 'Conteo físico',
                    merma: 'Merma o daño',
                }}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Ajustar existencia de Omeprazol',
            }),
        );
        const dialog = screen.getByRole('dialog');
        fireEvent.change(within(dialog).getByLabelText(/Existencia real/), {
            target: { value: '12' },
        });
        expect(within(dialog).getByText('Se suman 3 unidades.')).toBeTruthy();
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Ajustar' }),
        );

        expect(mockPost).toHaveBeenCalledWith(
            '/almacen/articulos/2/ajustes',
            { new_stock: 12, reason: 'conteo', note: null },
            expect.anything(),
        );
    });

    it('the edit dialog shows the cost of each supplier', () => {
        render(<AlmacenIndex items={catalog} can_edit />);

        fireEvent.click(
            screen.getByRole('button', { name: 'Editar Dipirona' }),
        );
        expect(
            within(screen.getByRole('dialog')).getByText(
                'Costos por proveedor',
            ),
        ).toBeTruthy();
    });

    it('labels the expiry', () => {
        const now = new Date(2026, 9, 31);
        expect(expiryLabel('10/2026', now)).toBe('Vence este mes');
        expect(expiryLabel('12/2026', now)).toBe('Vence en 2 meses');
        expect(expiryLabel('09/2026', now)).toBe('Vencido');
    });
});

const entradaProps = {
    items: [
        {
            id: 1,
            code: 'MED-001',
            name: 'Dipirona',
            presentation: '1 g/2 ml · ampolla',
            kind: 'medicamento' as const,
            stock: 141,
            cost: 6200,
            price: 15000,
        },
    ],
    suppliers: [{ id: 7, name: 'Laboratorios Rowe' }],
    next_number: 'ENT-0004',
    recent: [
        {
            id: 3,
            number: 'ENT-0003',
            received_on: '24/10/2026',
            supplier: 'Laboratorios Rowe',
            lines_count: 2,
            total_cost: 450000,
        },
    ],
    today: '2026-10-31',
};

describe('Entrada de mercancía', () => {
    it('registers an entry with an existing product (its last cost is suggested)', () => {
        render(<EntradaIndex {...entradaProps} />);

        expect(screen.getByText('ENT-0004')).toBeTruthy();
        expect(screen.getByText('ENT-0003')).toBeTruthy();
        const submit = screen.getByRole('button', {
            name: /Registrar entrada/,
        });
        expect(submit).toBeDisabled();

        fireEvent.change(screen.getByLabelText(/Proveedor/), {
            target: { value: '7' },
        });
        fireEvent.change(screen.getByLabelText('Producto de la línea 1'), {
            target: { value: '1' },
        });
        expect(
            screen.getByLabelText('Costo unitario de la línea 1'),
        ).toHaveValue('62.00');
        fireEvent.change(screen.getByLabelText('Cantidad de la línea 1'), {
            target: { value: '60' },
        });
        fireEvent.change(screen.getByLabelText('Lote de la línea 1'), {
            target: { value: 'L1302' },
        });
        fireEvent.change(screen.getByLabelText('Vencimiento de la línea 1'), {
            target: { value: '2027-06' },
        });
        expect(screen.getAllByText('RD$3,720.00').length).toBeGreaterThan(0);
        fireEvent.click(submit);

        expect(mockPost).toHaveBeenCalledWith(
            '/entrada-mercancia',
            {
                supplier_id: 7,
                invoice_ref: null,
                received_on: '2026-10-31',
                lines: [
                    {
                        inventory_item_id: 1,
                        quantity: 60,
                        lot: 'L1302',
                        expires_on: '2027-06',
                        unit_cost: 6200,
                    },
                ],
            },
            expect.anything(),
        );
    });

    it('creates a product that is not in the catalog and warns about duplicates', () => {
        render(<EntradaIndex {...entradaProps} />);

        fireEvent.click(
            screen.getByRole('button', {
                name: /Producto nuevo \(no está en catálogo\)/,
            }),
        );
        let dialog = screen.getByRole('dialog');
        fireEvent.change(within(dialog).getByLabelText(/^Medicamento/), {
            target: { value: 'dipirona' },
        });
        expect(
            within(dialog).getByText(/Ya existe en el catálogo/),
        ).toBeTruthy();

        fireEvent.click(within(dialog).getByRole('tab', { name: 'Insumo' }));
        dialog = screen.getByRole('dialog');
        fireEvent.change(within(dialog).getByLabelText(/^Insumo/), {
            target: { value: 'Gasa estéril 4x4' },
        });
        fireEvent.change(within(dialog).getByLabelText(/Presentación/), {
            target: { value: 'Paquete de 10' },
        });
        fireEvent.change(within(dialog).getByLabelText(/Costo unit/), {
            target: { value: '9' },
        });
        fireEvent.change(within(dialog).getByLabelText(/Precio de venta/), {
            target: { value: '25' },
        });
        expect(within(dialog).getByText('178 %')).toBeTruthy();
        fireEvent.click(
            within(dialog).getByRole('button', {
                name: 'Crear y agregar a la entrada',
            }),
        );

        expect(screen.getByText('Nuevo')).toBeTruthy();
        fireEvent.change(screen.getByLabelText(/Proveedor/), {
            target: { value: '7' },
        });
        fireEvent.change(screen.getByLabelText('Cantidad de la línea 2'), {
            target: { value: '100' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Quitar línea 1' }));
        fireEvent.click(
            screen.getByRole('button', { name: /Registrar entrada/ }),
        );

        expect(mockPost).toHaveBeenCalledWith(
            '/entrada-mercancia',
            expect.objectContaining({
                lines: [
                    {
                        new_item: {
                            name: 'Gasa estéril 4x4',
                            presentation: 'Paquete de 10',
                            kind: 'insumo',
                            price: 2500,
                            min_stock: 0,
                        },
                        quantity: 100,
                        lot: null,
                        expires_on: null,
                        unit_cost: 900,
                    },
                ],
            }),
            expect.anything(),
        );
    });
});

describe('Proveedores', () => {
    it('registers a supplier', () => {
        render(<Proveedores suppliers={[]} can_edit />);

        expect(screen.getByText('Todavía no hay proveedores.')).toBeTruthy();
        fireEvent.click(
            screen.getByRole('button', { name: 'Nuevo proveedor' }),
        );
        const dialog = screen.getByRole('dialog');
        fireEvent.change(within(dialog).getByLabelText(/Nombre/), {
            target: { value: 'Laboratorios Rowe' },
        });
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Registrar proveedor' }),
        );

        expect(mockPost).toHaveBeenCalledWith(
            '/almacen/proveedores',
            { name: 'Laboratorios Rowe', rnc: '', phone: '', contact: '' },
            expect.anything(),
        );
    });
});
