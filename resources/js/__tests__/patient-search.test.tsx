/**
 * Tests for the shared PatientSearch component.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import PatientSearch from '@/components/cemerog/PatientSearch';

vi.mock('@inertiajs/react', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@inertiajs/react')>()),
}));

afterEach(() => {
    cleanup();
});

describe('PatientSearch – compact prop', () => {
    it('renders the input without compact prop (default style)', () => {
        render(
            <PatientSearch
                selected={null}
                query=""
                onQueryChange={() => {}}
                onSelect={() => {}}
                onClear={() => {}}
                endpoint="/pacientes/buscar"
            />,
        );
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        // Default (non-compact) has rounded-[10px] class
        expect(input.className).toMatch(/rounded/);
    });

    it('renders in compact mode when compact=true', () => {
        render(
            <PatientSearch
                selected={null}
                query=""
                onQueryChange={() => {}}
                onSelect={() => {}}
                onClear={() => {}}
                endpoint="/pacientes/buscar"
                compact
            />,
        );
        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        // Compact has rounded-md class
        expect(input.className).toMatch(/rounded-md/);
    });
});

describe('PatientSearch – shared behaviour', () => {
    const renderSearch = (
        props: Partial<React.ComponentProps<typeof PatientSearch>> = {},
    ) =>
        render(
            <PatientSearch
                selected={null}
                query=""
                onQueryChange={() => {}}
                onSelect={() => {}}
                onClear={() => {}}
                endpoint="/pacientes/buscar"
                {...props}
            />,
        );

    it('does not search with fewer than 3 characters, like the backend', () => {
        vi.useFakeTimers();
        global.fetch = vi.fn();
        const { rerender } = renderSearch({ query: 'An' });

        act(() => {
            vi.advanceTimersByTime(400);
        });
        expect(global.fetch).not.toHaveBeenCalled();

        rerender(
            <PatientSearch
                selected={null}
                query="Ana"
                onQueryChange={() => {}}
                onSelect={() => {}}
                onClear={() => {}}
                endpoint="/pacientes/buscar"
            />,
        );
        act(() => {
            vi.advanceTimersByTime(400);
        });
        expect(global.fetch).toHaveBeenCalledWith('/pacientes/buscar?q=Ana');
        vi.useRealTimers();
    });
});
