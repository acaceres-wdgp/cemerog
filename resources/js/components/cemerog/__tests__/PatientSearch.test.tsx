import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PatientSearch, { type PatientResult } from '../PatientSearch';

const ENDPOINT = '/citas/pacientes/buscar';

function renderSearch(overrides: {
    selected?: PatientResult | null;
    query?: string;
    error?: string;
} = {}) {
    const onQueryChange = vi.fn();
    const onSelect = vi.fn();
    const onClear = vi.fn();

    const { rerender } = render(
        <PatientSearch
            selected={overrides.selected ?? null}
            query={overrides.query ?? ''}
            onQueryChange={onQueryChange}
            onSelect={onSelect}
            onClear={onClear}
            error={overrides.error}
            endpoint={ENDPOINT}
        />,
    );

    return { onQueryChange, onSelect, onClear, rerender };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('PatientSearch', () => {
    it('renders a search input when no patient is selected', () => {
        renderSearch();
        expect(
            screen.getByPlaceholderText('Buscar por nombre o cédula…'),
        ).toBeInTheDocument();
    });

    it('does NOT fetch with only 1 character', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch');
        renderSearch({ query: 'a' });

        // Wait more than the debounce time
        await new Promise((r) => setTimeout(r, 400));

        expect(fetchSpy).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    it('fetches with 2+ characters using the given endpoint', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => [],
        } as Response);

        renderSearch({ query: 'ab' });

        await waitFor(
            () => expect(fetchSpy).toHaveBeenCalledWith(`${ENDPOINT}?q=ab`),
            { timeout: 1000 },
        );

        fetchSpy.mockRestore();
    });

    it('shows "No se encontraron pacientes." when empty results', async () => {
        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => [],
        } as Response);

        renderSearch({ query: 'zz' });

        expect(
            await screen.findByText('No se encontraron pacientes.', {}, { timeout: 1000 }),
        ).toBeInTheDocument();
    });

    it('shows results when returned', async () => {
        const patients: PatientResult[] = [
            { id: 1, full_name: 'Juan Pérez', document_number: '001-0000001-1' },
            { id: 2, full_name: 'María López', document_number: '001-0000002-2' },
        ];

        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => patients,
        } as Response);

        renderSearch({ query: 'ju' });

        expect(await screen.findByText('Juan Pérez', {}, { timeout: 1000 })).toBeInTheDocument();
        expect(screen.getByText('María López')).toBeInTheDocument();
    });

    it('calls onSelect when a result is clicked', async () => {
        const patients: PatientResult[] = [
            { id: 1, full_name: 'Juan Pérez', document_number: '001-0000001-1' },
        ];

        vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => patients,
        } as Response);

        const { onSelect } = renderSearch({ query: 'ju' });

        const btn = await screen.findByText('Juan Pérez', {}, { timeout: 1000 });
        fireEvent.click(btn);

        expect(onSelect).toHaveBeenCalledWith(patients[0]);
    });

    it('shows selected patient with clear button', () => {
        const patient: PatientResult = {
            id: 1,
            full_name: 'Juan Pérez',
            document_number: '001-0000001-1',
        };

        renderSearch({ selected: patient, query: '' });

        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('001-0000001-1')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '✕' })).toBeInTheDocument();
    });

    it('calls onClear when clear button is clicked', () => {
        const patient: PatientResult = {
            id: 1,
            full_name: 'Juan Pérez',
            document_number: '001',
        };

        const { onClear } = renderSearch({ selected: patient });

        const clearBtn = screen.getByRole('button', { name: '✕' });
        fireEvent.click(clearBtn);

        expect(onClear).toHaveBeenCalled();
    });

    it('shows error message when error prop is provided', () => {
        renderSearch({ error: 'Selecciona un paciente.' });
        // error is shown below input
        expect(screen.getByText('Selecciona un paciente.')).toBeInTheDocument();
    });

    it('uses the provided endpoint for fetch', async () => {
        const customEndpoint = '/tablero/pacientes/buscar';
        const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => [],
        } as Response);

        render(
            <PatientSearch
                selected={null}
                query="ab"
                onQueryChange={vi.fn()}
                onSelect={vi.fn()}
                onClear={vi.fn()}
                endpoint={customEndpoint}
            />,
        );

        await waitFor(
            () =>
                expect(fetchSpy).toHaveBeenCalledWith(
                    `${customEndpoint}?q=ab`,
                ),
            { timeout: 1000 },
        );

        fetchSpy.mockRestore();
    });
});
