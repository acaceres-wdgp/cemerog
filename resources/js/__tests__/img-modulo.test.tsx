/**
 * Imágenes: cola de estudios y vista del paciente con el informe.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost, mockVisit, mockGet } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    mockVisit: vi.fn(),
    mockGet: vi.fn(),
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Link: ({
        children,
        href,
        className,
    }: {
        children: React.ReactNode;
        href: string;
        className?: string;
    }) => (
        <a href={href} className={className}>
            {children}
        </a>
    ),
    router: { post: mockPost, visit: mockVisit, get: mockGet, delete: vi.fn() },
    usePage: () => ({ props: { errors: {} } }),
}));

import ImgIndex from '@/pages/img/index';
import ImgShow from '@/pages/img/show';
import type { ImagingOrderDetail, ImagingStatus } from '@/components/img/types';

const patient = {
    id: 3,
    full_name: 'Rosa María Peña Almonte',
    age: 34,
    sex: 'F',
    document_number: '031-0456789-2',
};

const order = (
    status: ImagingStatus,
    extra: Partial<ImagingOrderDetail> = {},
): ImagingOrderDetail => ({
    id: 8,
    number: 'I-0008',
    name: 'Sonografía abdominal',
    modality: 'Sonografía',
    status,
    price: 150000,
    ordered_at: '01/11/2026 09:10',
    ordered_date: '01/11/2026',
    ordered_time: '09:10',
    origin: 'Consulta',
    doctor: 'Dr. Franklin Rodríguez',
    indication: 'Dolor en hipocondrio derecho.',
    cancel_reason: null,
    files_count: 0,
    findings: null,
    conclusion: null,
    performed_at: null,
    signed_at: null,
    signed_by: null,
    editable: status === 'realizado' || status === 'borrador',
    attachments: [],
    ...extra,
});

const renderShow = (o: ImagingOrderDetail, canSign = true) =>
    render(
        <ImgShow
            patient={patient}
            studies={[o]}
            order={o}
            can_sign={canSign}
        />,
    );

beforeEach(() => {
    mockPost.mockReset();
    mockVisit.mockReset();
    mockGet.mockReset();
});

describe('Imágenes · cola', () => {
    it('lists the studies, filters by status and opens the patient view', () => {
        render(
            <ImgIndex
                orders={[{ ...order('ordenada'), patient }]}
                pagination={{
                    current_page: 1,
                    last_page: 1,
                    total: 1,
                    from: 1,
                    to: 1,
                }}
                counts={{ ordenada: 1 }}
                pending={1}
            />,
        );

        expect(screen.getByText(/1 estudio pendiente/)).toBeTruthy();
        expect(screen.getByText('Mostrando 1–1 de 1 estudios')).toBeTruthy();
        fireEvent.click(screen.getByRole('tab', { name: /Informe listo/ }));
        expect(mockGet).toHaveBeenCalledWith(
            expect.stringContaining('estado=listo'),
            {},
            expect.anything(),
        );

        fireEvent.click(screen.getByText('Rosa María Peña Almonte'));
        expect(mockVisit).toHaveBeenCalledWith('/imagenes/ordenes/8');
    });
});

describe('Imágenes · informe', () => {
    it('an ordered study is marked as performed (it is charged then)', () => {
        renderShow(order('ordenada'));

        expect(screen.queryByLabelText('Hallazgos')).toBeNull();
        fireEvent.click(
            screen.getByRole('button', { name: /Estudio realizado/ }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/imagenes/ordenes/8/realizado',
            {},
            expect.anything(),
        );
    });

    it('drafts and signs the report once findings and conclusion are written', () => {
        renderShow(order('realizado'));

        const sign = screen.getByRole('button', { name: /Firmar y enviar/ });
        expect(sign).toBeDisabled();
        fireEvent.change(screen.getByLabelText('Hallazgos'), {
            target: { value: 'Hígado de tamaño normal.' },
        });
        fireEvent.click(
            screen.getByRole('button', { name: 'Guardar borrador' }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/imagenes/ordenes/8/informe',
            { findings: 'Hígado de tamaño normal.', conclusion: '' },
            expect.anything(),
        );

        fireEvent.change(screen.getByLabelText('Conclusión'), {
            target: { value: 'Sin alteraciones.' },
        });
        fireEvent.click(sign);
        expect(mockPost).toHaveBeenLastCalledWith(
            '/imagenes/ordenes/8/firmar',
            {
                findings: 'Hígado de tamaño normal.',
                conclusion: 'Sin alteraciones.',
            },
            expect.anything(),
        );
        expect(screen.getByLabelText('Adjuntar imágenes o PDF')).toBeTruthy();
    });

    it('only imaging signs: others can only save the draft', () => {
        renderShow(order('borrador'), false);

        expect(
            screen.queryByRole('button', { name: /Firmar y enviar/ }),
        ).toBeNull();
        expect(screen.getByText('Firma el área de Imágenes.')).toBeTruthy();
    });

    it('a signed report is read-only, prints and is delivered', () => {
        renderShow(
            order('listo', {
                findings: 'Normal.',
                conclusion: 'Sin alteraciones.',
                signed_by: 'Lic. Ramírez',
                signed_at: '01/11/2026 11:40',
                attachments: [
                    { id: 4, name: 'eco-1.jpg', size: 204800, is_image: true },
                ],
            }),
        );

        expect(screen.getByLabelText('Hallazgos')).toHaveAttribute('readonly');
        expect(
            screen.getByText('Firmado por Lic. Ramírez · 01/11/2026 11:40'),
        ).toBeTruthy();
        expect(
            screen
                .getByRole('link', { name: 'eco-1.jpg' })
                .getAttribute('href'),
        ).toBe('/imagenes/adjuntos/4');
        expect(screen.queryByLabelText('Adjuntar imágenes o PDF')).toBeNull();
        expect(
            screen
                .getByRole('link', { name: /Imprimir informe/ })
                .getAttribute('href'),
        ).toBe('/imagenes/ordenes/8/imprimir');

        fireEvent.click(
            screen.getByRole('button', { name: /Marcar como entregado/ }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/imagenes/ordenes/8/entregar',
            {},
            expect.anything(),
        );
    });

    it('an ordered study can be cancelled with a reason', () => {
        renderShow(order('ordenada'));
        fireEvent.click(screen.getByRole('button', { name: /Cancelar orden/ }));

        const dialog = screen.getByRole('dialog');
        fireEvent.change(within(dialog).getByRole('textbox'), {
            target: { value: 'Se la hará en otro centro' },
        });
        fireEvent.click(
            within(dialog).getByRole('button', { name: 'Cancelar orden' }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/imagenes/ordenes/8/cancelar',
            { reason: 'Se la hará en otro centro' },
            expect.anything(),
        );
    });
});
