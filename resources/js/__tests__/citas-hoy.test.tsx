/**
 * «Hoy» and «Mañana» in Citas use the clinic's day sent by the server, so at
 * night (already tomorrow in UTC) they don't jump a day ahead.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import CitasIndex from '@/pages/citas/index';

const { mockRouterGet } = vi.hoisted(() => ({ mockRouterGet: vi.fn() }));

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
    Head: () => null,
    router: { get: mockRouterGet, post: vi.fn(), delete: vi.fn() },
}));

const props = {
    appointments: [],
    doctors: [],
    today: '2026-11-05',
};

beforeEach(() => {
    // 9:30 p. m. in Santo Domingo: 2026-11-06 in UTC
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-05T21:30:00-04:00'));
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    mockRouterGet.mockClear();
});

const navigatedTo = () => mockRouterGet.mock.calls.at(-1)?.[1];

describe('Citas – Hoy y Mañana', () => {
    it('the «Hoy» segment goes to the clinic day', () => {
        render(<CitasIndex {...props} date="2026-11-12" is_today={false} />);
        fireEvent.click(screen.getAllByRole('button', { name: 'Hoy' })[0]);
        expect(navigatedTo()).toEqual({ date: '2026-11-05' });
    });

    it('the «Hoy» button between the arrows goes to the clinic day', () => {
        render(<CitasIndex {...props} date="2026-11-12" is_today={false} />);
        fireEvent.click(screen.getAllByRole('button', { name: 'Hoy' })[1]);
        expect(navigatedTo()).toEqual({ date: '2026-11-05' });
    });

    it('«Mañana» goes to the next clinic day', () => {
        render(<CitasIndex {...props} date="2026-11-05" is_today />);
        fireEvent.click(screen.getByRole('button', { name: 'Mañana' }));
        expect(navigatedTo()).toEqual({ date: '2026-11-06' });
    });

    it('the arrows move one day from the date shown', () => {
        render(<CitasIndex {...props} date="2026-11-30" is_today={false} />);
        fireEvent.click(screen.getByRole('button', { name: 'Día siguiente' }));
        expect(navigatedTo()).toEqual({ date: '2026-12-01' });
    });
});
