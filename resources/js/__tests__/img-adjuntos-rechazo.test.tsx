import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    router: { post: mockPost, delete: vi.fn() },
    usePage: () => ({ props: { errors: {} } }),
}));

import AttachmentsField from '@/pages/img/components/AttachmentsField';

const MB = 1024 * 1024;

function fileOf(name: string, bytes: number): File {
    const file = new File(['x'], name, { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: bytes });
    return file;
}

function choose(...files: File[]) {
    fireEvent.change(screen.getByLabelText('Adjuntar imágenes o PDF'), {
        target: { files },
    });
}

/** The visit options passed to router.post on the last upload */
function lastOptions() {
    return mockPost.mock.calls.at(-1)![2];
}

describe('Adjuntos: avisar cuando no se guardan', () => {
    beforeEach(() => {
        mockPost.mockClear();
        render(<AttachmentsField orderId={4} files={[]} editable />);
    });

    it('does not send a file over 20 MB and says so', () => {
        choose(fileOf('tac.pdf', 21 * MB));

        expect(mockPost).not.toHaveBeenCalled();
        expect(screen.getByRole('alert').textContent).toContain(
            '«tac.pdf» pesa 21.0 MB. El máximo es 20 MB por archivo',
        );
    });

    it('does not send more than 10 files at once', () => {
        choose(
            ...Array.from({ length: 11 }, (_, i) => fileOf(`f${i}.pdf`, MB)),
        );

        expect(mockPost).not.toHaveBeenCalled();
        expect(screen.getByRole('alert').textContent).toContain(
            'Puedes adjuntar hasta 10 archivos a la vez',
        );
    });

    it('explains a rejection by the server for size', () => {
        choose(fileOf('rx.pdf', 15 * MB));
        let handled: boolean | void = undefined;
        act(() => {
            handled = lastOptions().onHttpException({ status: 413 });
        });

        // false: Inertia does not open its own error dialog
        expect(handled).toBe(false);
        expect(screen.getByRole('alert').textContent).toContain(
            'El servidor no aceptó el archivo por su tamaño. No se guardó: prueba con un archivo más pequeño.',
        );
    });

    it('suggests uploading apart only when several files were sent', () => {
        choose(fileOf('a.pdf', 9 * MB), fileOf('b.pdf', 9 * MB));
        act(() => {
            lastOptions().onHttpException({ status: 413 });
        });

        expect(screen.getByRole('alert').textContent).toContain(
            'prueba con un archivo más pequeño o súbelos de uno en uno.',
        );
    });

    it('explains any other server error', () => {
        choose(fileOf('rx.pdf', MB));
        act(() => {
            lastOptions().onHttpException({ status: 500 });
        });

        expect(screen.getByRole('alert').textContent).toContain(
            'No se pudo subir el archivo (error 500). No se guardó',
        );
    });

    it('explains a dropped connection', () => {
        choose(fileOf('rx.pdf', 15 * MB));
        let handled: boolean | void = undefined;
        act(() => {
            handled = lastOptions().onNetworkError(new Error('reset'));
        });

        expect(handled).toBe(false);
        expect(screen.getByRole('alert').textContent).toContain(
            'Se cortó la conexión mientras se subía. No se guardó',
        );
    });

    it('shows that the upload is in progress', () => {
        choose(fileOf('rx.pdf', MB));
        act(() => {
            lastOptions().onStart();
        });
        expect(screen.getByText('Subiendo…')).toBeTruthy();

        act(() => {
            lastOptions().onFinish();
        });
        expect(screen.queryByText('Subiendo…')).toBeNull();
    });

    it('clears the previous message on a new upload', () => {
        choose(fileOf('tac.pdf', 21 * MB));
        choose(fileOf('rx.pdf', MB));

        expect(screen.queryByRole('alert')).toBeNull();
        expect(mockPost).toHaveBeenCalledTimes(1);
    });
});
