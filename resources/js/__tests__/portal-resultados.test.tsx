/**
 * Results portal (public, for patients): code and date formatting, the
 * access form with its errors and help, the list and the viewer.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost, page, head } = vi.hoisted(() => ({
    mockPost: vi.fn(),
    head: { title: '' },
    page: {
        component: 'portal/acceso',
        props: {} as Record<string, unknown>,
        flash: {} as Record<string, unknown>,
    },
}));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: { post: mockPost },
    usePage: () => page,
    Head: ({ title }: { title: string }) => {
        head.title = title;
        return null;
    },
}));

import { formatBirthDate, formatCode, isComplete } from '@/lib/result-code';
import PortalAcceso from '@/pages/portal/acceso';
import PortalEstudio from '@/pages/portal/estudio';
import PortalResultados from '@/pages/portal/resultados';
import type { PortalPatient, PortalStudyDetail } from '@/pages/portal/types';

const clinic = {
    name: 'Centro Médico Rodríguez Guzmán',
    rnc: null,
    phone: '(809) 579-2000',
    address: 'Montecristi',
};
const patient: PortalPatient = {
    name: 'Rosa María Peña Almonte',
    age_sex: '34 años · F',
    service_date: '26/11/2026',
    invoice: 'F-0001246',
    expires_on: '24/02/2027',
};

beforeEach(() => {
    mockPost.mockReset();
    page.flash = {};
});

describe('code and date formatting', () => {
    it('formats the code as CMG-XXXX-XXXX while typing, in uppercase', () => {
        expect(formatCode('7k4p')).toBe('CMG-7K4P');
        expect(formatCode('7k4p2')).toBe('CMG-7K4P-2');
        expect(formatCode('cmg 7k4p-29xq')).toBe('CMG-7K4P-29XQ');
        expect(formatCode('CMG-7K4P-29XQ-EXTRA')).toBe('CMG-7K4P-29XQ');
        expect(formatCode('')).toBe('');
    });

    it('formats the birth date as DD/MM/AAAA, digits only', () => {
        expect(formatBirthDate('21')).toBe('21');
        expect(formatBirthDate('2105')).toBe('21/05');
        expect(formatBirthDate('21051992')).toBe('21/05/1992');
        expect(formatBirthDate('21/05/1992xx9')).toBe('21/05/1992');
    });

    it('knows when both are complete', () => {
        expect(isComplete('CMG-7K4P-29XQ', '21/05/1992')).toBe(true);
        expect(isComplete('CMG-7K4P-29X', '21/05/1992')).toBe(false);
        expect(isComplete('CMG-7K4P-29XQ', '21/05/19')).toBe(false);
    });
});

describe('access', () => {
    it('formats what is typed and sends code and date', () => {
        render(<PortalAcceso clinic={clinic} prefill="cmg7k4p29xq" />);

        const code = screen.getByLabelText(/Código de resultados/);
        expect(code).toHaveValue('CMG-7K4P-29XQ');
        const date = screen.getByLabelText(/Fecha de nacimiento/);
        expect(date).toHaveAttribute('inputmode', 'numeric');
        fireEvent.change(date, { target: { value: '21051992' } });
        expect(date).toHaveValue('21/05/1992');

        fireEvent.click(
            screen.getByRole('button', { name: 'Ver mis resultados' }),
        );
        expect(mockPost).toHaveBeenCalledWith(
            '/resultados/acceso',
            { code: 'CMG-7K4P-29XQ', birth_date: '21/05/1992' },
            expect.anything(),
        );
        expect(
            screen.getByRole('button', { name: 'Verificando…' }),
        ).toBeDisabled();
    });

    it('asks for the missing data without sending', () => {
        render(<PortalAcceso clinic={clinic} />);

        fireEvent.click(
            screen.getByRole('button', { name: 'Ver mis resultados' }),
        );

        expect(screen.getByRole('alert').textContent).toContain(
            'Faltan datos.',
        );
        expect(mockPost).not.toHaveBeenCalled();
    });

    it('shows the generic error with the attempts left, and hides it on typing', () => {
        page.flash = { access_error: { type: 'datos', remaining: 3 } };
        render(<PortalAcceso clinic={clinic} />);

        expect(screen.getByRole('alert').textContent).toContain(
            'No encontramos resultados con esos datos.',
        );
        expect(screen.getByRole('alert').textContent).toContain(
            'Te quedan 3 intentos.',
        );

        fireEvent.change(screen.getByLabelText(/Fecha de nacimiento/), {
            target: { value: '2' },
        });
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('locked: the button waits 15 minutes', () => {
        render(<PortalAcceso clinic={clinic} locked />);

        expect(
            screen.getByRole('button', { name: 'Intenta en 15 minutos' }),
        ).toBeDisabled();
    });

    it('an expired code says when', () => {
        page.flash = { access_error: { type: 'vencido', date: '10/09/2026' } };
        render(<PortalAcceso clinic={clinic} />);

        expect(screen.getByRole('alert').textContent).toContain(
            'Este código venció el 10/09/2026.',
        );
    });

    it('the help opens and closes', () => {
        render(<PortalAcceso clinic={clinic} />);

        fireEvent.click(
            screen.getByRole('button', { name: '¿Dónde encuentro mi código?' }),
        );
        const dialog = screen.getByRole('dialog', {
            name: '¿Dónde está mi código?',
        });
        expect(within(dialog).getByText('CMG-7K4P-29XQ')).toBeTruthy();

        fireEvent.keyDown(dialog, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).toBeNull();
    });
});

describe('my results', () => {
    const studies = [
        {
            key: 'lab-1',
            kind: 'lab' as const,
            name: 'Hemograma completo',
            ready: true,
            detail: 'Validado el 26/11/2026',
        },
        {
            key: 'lab-2',
            kind: 'lab' as const,
            name: 'Examen de orina',
            ready: false,
            detail: 'Aún en el laboratorio.',
        },
        {
            key: 'img-3',
            kind: 'img' as const,
            name: 'Radiografía de tórax',
            ready: false,
            detail: 'Estudio realizado.',
        },
    ];

    it('groups the studies; only the ready ones can be seen and downloaded', () => {
        render(<PortalResultados patient={patient} studies={studies} />);

        expect(screen.getByText('Rosa María Peña Almonte')).toBeTruthy();
        expect(screen.getByText(/1 de 3 resultados está listo/)).toBeTruthy();
        expect(screen.getByText('24/02/2027')).toBeTruthy();

        const lab = screen.getByRole('region', { name: 'Laboratorio' });
        const hemo = within(lab)
            .getByText('Hemograma completo')
            .closest('article')!;
        expect(within(hemo).getByText('Listo')).toBeTruthy();
        expect(within(hemo).getByRole('link', { name: /Ver/ })).toHaveAttribute(
            'href',
            '/resultados/estudio/lab-1',
        );
        expect(
            within(hemo).getByRole('link', {
                name: 'Descargar PDF de Hemograma completo',
            }),
        ).toHaveAttribute('href', '/resultados/estudio/lab-1/pdf');

        const orina = within(lab)
            .getByText('Examen de orina')
            .closest('article')!;
        expect(within(orina).getByText('En proceso')).toBeTruthy();
        expect(within(orina).queryByRole('link')).toBeNull();

        const img = screen.getByRole('region', { name: 'Imágenes' });
        expect(within(img).queryByRole('link')).toBeNull();
        expect(
            screen.getByRole('link', { name: /Descargar todos \(1\)/ }),
        ).toHaveAttribute('href', '/resultados/todos.pdf');
    });

    it('nothing ready: no download', () => {
        render(
            <PortalResultados
                patient={patient}
                studies={studies.map((s) => ({ ...s, ready: false }))}
            />,
        );

        expect(
            screen.queryByRole('link', { name: /Descargar todos/ }),
        ).toBeNull();
    });
});

describe('viewer', () => {
    const base = {
        department: 'Laboratorio clínico',
        taken: '26/11/2026 · 8:05 AM',
        taken_label: 'Toma de muestra',
        doctor: 'Dr. Franklin Rodríguez',
        validated_by: 'Lic. Altagracia Rosario',
        validated_at: '26/11/2026 11:20 AM',
    };

    it('lab: the table with the out-of-range values marked A or B', () => {
        const study: PortalStudyDetail = {
            ...base,
            key: 'lab-1',
            kind: 'lab',
            name: 'Hemograma completo',
            verification: 'L-0012-1',
            rows: [
                {
                    test: 'Glóbulos blancos',
                    value: '11.8',
                    unit: 'x10³/µL',
                    reference: '4.5 – 11',
                    flag: 'A',
                },
                {
                    test: 'Hemoglobina',
                    value: '13.4',
                    unit: 'g/dL',
                    reference: '12 – 16',
                    flag: '',
                },
            ],
        };
        render(
            <PortalEstudio patient={patient} study={study} clinic={clinic} />,
        );

        // The name the browser offers for the PDF
        expect(head.title).toBe(
            `Hemograma completo - ${patient.name} - 2026-11-26`,
        );
        const high = screen.getByText('Glóbulos blancos').closest('tr')!;
        expect(within(high).getByText('A')).toBeTruthy();
        expect(screen.getByText('Verificación: L-0012-1')).toBeTruthy();
        expect(screen.getByText('Lic. Altagracia Rosario')).toBeTruthy();
        expect(
            screen.getByRole('link', { name: /Descargar PDF/ }),
        ).toHaveAttribute('href', '/resultados/estudio/lab-1/pdf');
    });

    it('imaging: the images to download, findings and impression', () => {
        const study: PortalStudyDetail = {
            ...base,
            key: 'img-3',
            kind: 'img',
            name: 'Radiografía de tórax',
            department: 'Departamento de imágenes',
            verification: 'I-0003',
            findings: 'Silueta cardíaca normal.',
            conclusion: 'Sin alteraciones.',
            images: [{ n: 1, name: 'Proyección PA.jpg' }],
        };
        render(
            <PortalEstudio patient={patient} study={study} clinic={clinic} />,
        );

        expect(
            screen.getByRole('img', { name: 'Proyección PA.jpg' }),
        ).toHaveAttribute('src', '/resultados/estudio/img-3/imagen/1');
        expect(
            screen.getByRole('link', { name: 'Descargar Proyección PA.jpg' }),
        ).toBeTruthy();
        expect(screen.getByText('Silueta cardíaca normal.')).toBeTruthy();
        expect(screen.getByText('Sin alteraciones.')).toBeTruthy();
    });
});
