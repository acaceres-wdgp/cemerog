/**
 * Imaging reports where the doctor works: Consulta (Órdenes y cargos,
 * historial) and the cancel of a study not performed.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: { post: mockPost, get: vi.fn() },
    usePage: () => ({ props: { errors: {} } }),
}));

import type {
    ImagingOrderWithReport,
    ImagingReport,
} from '@/components/img/types';
import CuentaOrdenesTab from '@/pages/consulta/components/CuentaOrdenesTab';
import HistorialDetail from '@/pages/consulta/components/HistorialDetail';
import type { ClinicalEntry } from '@/pages/consulta/types';

const report: ImagingReport = {
    number: 'I-0002',
    name: 'Radiografía de tórax PA',
    findings: 'Campos pulmonares sin infiltrados.',
    conclusion: 'Tórax sin alteraciones.',
    signed_at: '01/11/2026 10:30',
    signed_by: 'Lic. Ramírez',
    attachments: [{ id: 6, name: 'torax.jpg', is_image: true }],
};

const order = (o: Partial<ImagingOrderWithReport>): ImagingOrderWithReport => ({
    id: 2,
    number: 'I-0002',
    name: 'Radiografía de tórax PA',
    modality: 'Radiografía',
    status: 'listo',
    price: 80000,
    ordered_at: '01/11/2026 08:10',
    ordered_date: '01/11/2026',
    ordered_time: '08:10',
    origin: 'Consulta',
    doctor: 'Dr. Franklin Rodríguez',
    indication: null,
    cancel_reason: null,
    files_count: 1,
    report,
    ...o,
});

describe('Informes de imágenes en Consulta', () => {
    it('«Órdenes y cargos» lists the imaging orders and the signed report', () => {
        render(
            <CuentaOrdenesTab
                charges={[]}
                chargesTotal={0}
                imagingOrders={[
                    order({}),
                    order({
                        id: 3,
                        number: 'I-0003',
                        name: 'Sonografía abdominal',
                        status: 'ordenada',
                        report: null,
                    }),
                ]}
            />,
        );

        expect(screen.getByText('Informe listo')).toBeTruthy();
        expect(screen.getByText('Tórax sin alteraciones.')).toBeTruthy();
        expect(
            screen
                .getByRole('link', { name: /torax.jpg/ })
                .getAttribute('href'),
        ).toBe('/imagenes/adjuntos/6');
        expect(
            screen.queryByText('No hay órdenes para esta consulta.'),
        ).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
        const dialog = screen.getByRole('dialog');
        fireEvent.change(within(dialog).getByRole('textbox'), {
            target: { value: 'Se la hará en otro centro' },
        });
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Cancelar orden' }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/imagenes/ordenes/3/cancelar',
            { reason: 'Se la hará en otro centro' },
            expect.anything(),
        );
    });

    it('the clinical history shows the signed report', () => {
        const entry: ClinicalEntry = {
            type: 'imagen',
            date: '2026-11-01T10:30:00-04:00',
            mine: true,
            doctor: {
                id: 1,
                full_name: 'Dr. Franklin Rodríguez',
                specialty: 'Medicina General',
            },
            imaging: report,
        };
        render(<HistorialDetail sel={entry} canPrint={false} />);

        expect(screen.getByText('Informe · I-0002')).toBeTruthy();
        expect(
            screen.getByText('Campos pulmonares sin infiltrados.'),
        ).toBeTruthy();
        expect(
            screen.getByText('Firmado por Lic. Ramírez · 01/11/2026 10:30'),
        ).toBeTruthy();
    });
});
